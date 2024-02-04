import { maxAge, DeletionRequest, DeletionRequestHydrated } from "../deletion_request";
import { DeletionConfirmationSanitized } from "../deletion_confirmation";
import getDeletionConfirmations from "../deletion_confirmation/getByDeletionRequest";
import hydrateDeletionConfirmation from "../deletion_confirmation/hydrate";

export default async function hydrateDeletionRequest(dr: DeletionRequest): Promise<DeletionRequestHydrated> {
  const dcs = await getDeletionConfirmations(dr.id);
  const hydratedDCs = await Promise.all(dcs.map((dc) => hydrateDeletionConfirmation(dc)));
  const sanitized: DeletionConfirmationSanitized[] = [];

  for (const hydratedDC of hydratedDCs) {
    if (hydratedDC.retracedUser) {
      sanitized.push({
        id: hydratedDC.id,
        userId: hydratedDC.retracedUser.id,
        email: hydratedDC.retracedUser.email,
        approved: !!hydratedDC.received,
      });
    }
  }

  return {
    ...dr,
    deletionConfirmations: sanitized,
    expiration: dr.created.clone().add(maxAge),
  };
}
