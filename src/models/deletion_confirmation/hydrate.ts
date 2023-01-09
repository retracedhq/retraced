import {
  DeletionConfirmation,
  DeletionConfirmationHydrated,
} from "../deletion_confirmation";
import getUser from "../user/get";

export default async function hydrateDeletionConfirmation(
  dc: DeletionConfirmation
): Promise<DeletionConfirmationHydrated> {
  return {
    ...dc,
    retracedUser: await getUser(dc.retracedUserId),
  };
}
