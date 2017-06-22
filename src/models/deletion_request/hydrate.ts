import "source-map-support/register";
import {DeletionRequest, DeletionRequestHydrated} from "../deletion_request";
import getDeletionConfirmations from "../deletion_confirmation/getByDeletionRequest";
import hydrateDeletionConfirmation from "../deletion_confirmation/hydrate";

export default async function hydrateDeletionRequest(dr: DeletionRequest): Promise<DeletionRequestHydrated> {
    const dcs = await getDeletionConfirmations(dr.id);
    const hydratedDCs = await Promise.all(
      dcs.map((dc) => hydrateDeletionConfirmation(dc)),
    );

    return {
        ...dr,
        deletionConfirmations: hydratedDCs,
    };
}
