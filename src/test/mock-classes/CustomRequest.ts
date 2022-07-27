// import express from "express";
// import { MediaType, Response, Application } from "express-serve-static-core";
// import { Socket } from "net";

// export default class CustReq implements express.Request {
//     public accepted: MediaType[];
//     public protocol: string;
//     public secure: boolean;
//     public ip: string;
//     public ips: string[];
//     public subdomains: string[];
//     public path: string;
//     public hostname: string;
//     public host: string;
//     public fresh: boolean;
//     public stale: boolean;
//     public xhr: boolean;
//     public body: any;
//     public cookies: any;
//     public method: string;
//     public params: any;
//     public query: any;
//     public route: any;
//     public signedCookies: any;
//     public originalUrl: string;
//     public url: string;
//     public baseUrl: string;
//     public app: Application;
//     public httpVersion: string;
//     public httpVersionMajor: number;
//     public httpVersionMinor: number;
//     public connection: Socket;
//     public rawHeaders: string[];
//     public trailers: { [key: string]: string | undefined; };
//     public rawTrailers: string[];
//     public statusCode?: number | undefined;
//     public statusMessage?: string | undefined;
//     public socket: Socket;
//     public readable: boolean;
//     public readableHighWaterMark: number;
//     public headers: { [key: string]: string; };
//     public clearCookie(name: string, options?: any): Response {
//         throw new Error("Method not implemented.");
//     }
//     public setTimeout(msecs: number, callback: () => void): this {
//         throw new Error("Method not implemented.");
//     }
//     public destroy(error?: Error): void {
//         throw new Error("Method not implemented.");
//     }
//     public _read(size: number): void {
//         throw new Error("Method not implemented.");
//     }
//     public read(size?: number) {
//         throw new Error("Method not implemented.");
//     }
//     public setEncoding(encoding: string): this {
//         throw new Error("Method not implemented.");
//     }
//     public pause(): this {
//         throw new Error("Method not implemented.");
//     }
//     public resume(): this {
//         throw new Error("Method not implemented.");
//     }
//     public isPaused(): boolean {
//         throw new Error("Method not implemented.");
//     }
//     public unpipe<T extends NodeJS.WritableStream>(destination?: T): this {
//         throw new Error("Method not implemented.");
//     }
//     public unshift(chunk: any): void {
//         throw new Error("Method not implemented.");
//     }
//     public wrap(oldStream: NodeJS.ReadableStream): this {
//         throw new Error("Method not implemented.");
//     }
//     public push(chunk: any, encoding?: string): boolean {
//         throw new Error("Method not implemented.");
//     }
//     public _destroy(error: Error | null, callback: (error?: Error) => void): void {
//         throw new Error("Method not implemented.");
//     }
//     public addListener(event: string, listener: (...args: any[]) => void): this;
//     public addListener(event: "data", listener: (chunk: string | Buffer) => void): this;
//     public addListener(event: "close" | "end" | "readable", listener: () => void): this;
//     public addListener(event: "error", listener: (err: Error) => void): this;
//     public addListener(event: any, listener: any): this {
//         throw new Error("Method not implemented.");
//     }
//     public emit(event: string | symbol, ...args: any[]): boolean;
//     public emit(event: "close" | "end" | "readable"): boolean;
//     public emit(event: "data", chunk: string | Buffer): boolean;
//     public emit(event: "error", err: Error): boolean;
//     public emit(event: any, err?: any, ...rest: any[]): boolean {
//         throw new Error("Method not implemented." + rest);
//     }
//     public on(event: string, listener: (...args: any[]) => void): this;
//     public on(event: "close" | "end" | "readable", listener: () => void): this;
//     public on(event: "data", listener: (chunk: string | Buffer) => void): this;
//     public on(event: "error", listener: (err: Error) => void): this;
//     public on(event: any, listener: any): this {
//         throw new Error("Method not implemented.");
//     }
//     public once(event: string, listener: (...args: any[]) => void): this;
//     public once(event: "close" | "end" | "readable", listener: () => void): this;
//     public once(event: "data", listener: (chunk: string | Buffer) => void): this;
//     public once(event: "error", listener: (err: Error) => void): this;
//     public once(event: any, listener: any): this {
//         throw new Error("Method not implemented.");
//     }
//     public prependListener(event: string, listener: (...args: any[]) => void): this;
//     public prependListener(event: "close" | "end" | "readable", listener: () => void): this;
//     public prependListener(event: "data", listener: (chunk: string | Buffer) => void): this;
//     public prependListener(event: "error", listener: (err: Error) => void): this;
//     public prependListener(event: any, listener: any): this {
//         throw new Error("Method not implemented.");
//     }
//     public prependOnceListener(event: string, listener: (...args: any[]) => void): this;
//     public prependOnceListener(event: "close" | "end" | "readable", listener: () => void): this;
//     public prependOnceListener(event: "data", listener: (chunk: string | Buffer) => void): this;
//     public prependOnceListener(event: "error", listener: (err: Error) => void): this;
//     public prependOnceListener(event: any, listener: any): this {
//         throw new Error("Method not implemented.");
//     }
//     public removeListener(event: string, listener: (...args: any[]) => void): this;
//     public removeListener(event: "close" | "end" | "readable", listener: () => void): this;
//     public removeListener(event: "data", listener: (chunk: string | Buffer) => void): this;
//     public removeListener(event: "error", listener: (err: Error) => void): this;
//     public removeListener(event: any, listener: any): this {
//         throw new Error("Method not implemented.");
//     }
//     public pipe<T extends NodeJS.WritableStream>(destination: T, options?: { end?: boolean | undefined; }): T {
//         throw new Error("Method not implemented.");
//     }
//     public removeAllListeners(event?: string | symbol): this {
//         throw new Error("Method not implemented.");
//     }
//     public setMaxListeners(n: number): this {
//         throw new Error("Method not implemented.");
//     }
//     public getMaxListeners(): number {
//         throw new Error("Method not implemented.");
//     }
//     public listeners(event: string | symbol): () => [] {
//         throw new Error("Method not implemented.");
//     }
//     public eventNames(): Array<(string | symbol)> {
//         throw new Error("Method not implemented.");
//     }
//     public listenerCount(type: string | symbol): number {
//         throw new Error("Method not implemented.");
//     }
//     public get(name: string): string {
//         switch (name) {
//             case "Authorization":
//                 return `token=test`;
//             default:
//                 return `token=test`;
//         }
//     }
//     public header(name: string): string {
//         throw new Error("Method not implemented.");
//     }
//     public accepts(): string[];
//     public accepts(type: string | string[]): string | boolean;
//     public accepts(...type: string[]): string | boolean;
//     public accepts(type?: any, ...rest: any[]): string | boolean | string[] {
//         throw new Error("Method not implemented." + rest);
//     }
//     public acceptsCharsets(): string[];
//     public acceptsCharsets(charset: string | string[]): string | boolean;
//     public acceptsCharsets(...charset: string[]): string | boolean;
//     public acceptsCharsets(charset?: any, ...rest: any[]): string | boolean | string[] {
//         throw new Error("Method not implemented.");
//     }
//     public acceptsEncodings(): string[];
//     public acceptsEncodings(encoding: string | string[]): string | boolean;
//     public acceptsEncodings(...encoding: string[]): string | boolean;
//     public acceptsEncodings(encoding?: any, ...rest: any[]): string | boolean | string[] {
//         throw new Error("Method not implemented.");
//     }
//     public acceptsLanguages(): string[];
//     public acceptsLanguages(lang: string | string[]): string | boolean;
//     public acceptsLanguages(...lang: string[]): string | boolean;
//     public acceptsLanguages(lang?: any, ...rest: any[]): string | boolean | string[] {
//         throw new Error("Method not implemented.");
//     }
//     public range(size: number): any[] {
//         throw new Error("Method not implemented.");
//     }
//     public param(name: string, defaultValue?: any): string {
//         throw new Error("Method not implemented.");
//     }
//     public is(type: string): boolean {
//         throw new Error("Method not implemented.");
//     }
// }
