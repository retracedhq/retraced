import "source-map-support/register";
import { suite, test } from "mocha-typescript";
import { expect } from "chai";
import { meter, timer, counter, histogram, instrumented, getReport } from "../metrics";

@suite class MetricsTests {

    @test public "metrics.counter()"() {
        counter("foo.counter").inc(200);
        counter("foo.counter").dec(100);

        const count = counter("foo.counter").count;

        expect(count).to.equal(100);
    };

    @test public "metrics.meter()"() {
        meter("foo.bar").mark();
        meter("foo.bar").mark();

        const count = meter("foo.bar").count;

        expect(count).to.equal(2);
    };

    @test public "metrics.histogram()"() {
        histogram("foo.histogram").update(200);
        histogram("foo.histogram").update(100);

        const count = histogram("foo.histogram").count;
        const mean = histogram("foo.histogram").mean();

        expect(count).to.equal(2);
        expect(mean).to.equal(150);
    };

    @test public "metrics.timer()"() {
        timer("foo.baz").update(200);
        timer("foo.baz").update(100);

        const count = timer("foo.baz").count();
        const mean = timer("foo.baz").mean();

        expect(count).to.equal(2);
        expect(mean).to.equal(150);
    };

    @test public async "@instrumented this binding"() {
        /* tslint:disable */
        class X5 {
            private thing: any;

            constructor(thing: any) {
                this.thing = thing
            }
            @instrumented
            public async bindsCorrectThisArgument() {
                return this.thing;
            }
        }
        /* tslint:enable */

        const thing = 5;
        const d = new X5(thing);

        const boundField = await d.bindsCorrectThisArgument();
        expect(thing).to.equal(boundField);
    }

    @test public async "@instrumented throughput tracking and timing"() {

        const toNanos = (millis) => millis * 1000000;
        const sleepTime = 5;

        /* tslint:disable */
        class X5 {
            @instrumented
            public async throughputTracking() {
                return new Promise((res, rej) => {
                    setInterval(res, sleepTime);
                });
            }
        }
        /* tslint:enable */

        const d = new X5();

        await d.throughputTracking();
        await d.throughputTracking();

        const timer = getReport().getMetric("X5.throughputTracking");
        expect(timer.count()).to.equal(2);
        expect(timer.mean()).to.be.lessThan(toNanos(sleepTime + 2));
        expect(timer.mean()).to.be.greaterThan(toNanos(sleepTime - 2));
    }

    @test public async "@instrumented error tracking"() {

        /* tslint:disable */
        class X5 {
            @instrumented
            public async errorTracking() {
                return new Promise((res, rej) => {
                    rej("oh noes!");
                });
            }
        }
        /* tslint:enable */

        const d = new X5();
        try {
            await d.errorTracking();
        } catch (err) { /* ignored */ }

        const errors = getReport().getMetric("X5.errorTracking.errors");
        expect(errors.count).to.equal(1);
    }
}
