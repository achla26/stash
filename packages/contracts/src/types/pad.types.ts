import type { PadVisibility } from "../schemas/pad.schema";

export type { PadVisibility };

export interface Pad {
  id: string;
  slug: string;
  content: string;
  visibility: PadVisibility;
  userId: string | null;
  expiresAt: string | null;
  allowEdit: boolean;
  createdAt: string;
  updatedAt: string;
  ownerToken?: string | null;
}

export interface PadAccessResponse {
  exists: boolean;
  isPasswordProtected: boolean;
  data: Pad | null;
  canEdit?: boolean;
  isOwner?: boolean;
  isAnonymous?: boolean;
  error?: string;
  statusCode?: number;
}

export interface VerifyPasswordResponse {
  pad: Pad;
  canEdit: boolean;
}