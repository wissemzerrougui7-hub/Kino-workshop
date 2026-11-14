import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { OperationType, db, handleFirestoreError } from '../firebase';
import {
  ADMINS_COLLECTION,
  normalizeAdminEmail,
  type AdminMemberRecord,
} from './adminConfig';
import type { ArtworkChoice } from './registration';
import {
  CURRENT_WORKSHOP,
  normalizePublicAssetPath,
  type WorkshopConfig,
} from './theme';
import { GALLERY_WALL_ITEMS } from './galleryAndReviews';
import {
  REGISTRATIONS_COLLECTION,
  REVIEWS_COLLECTION,
  WORKSHOP_COLLECTION,
  WORKSHOP_DOC_ID,
  sanitizeWorkshopPayload,
  type RegistrationRecord,
  type ReviewRecord,
} from './adminHelpers';
import {
  GALLERY_ITEMS_COLLECTION,
  GALLERY_SEEDED_KEY,
  SITE_ASSETS_COLLECTION,
  getDefaultSiteAssetsMap,
  mergeSiteAssets,
  sanitizeGalleryItemPayload,
  sanitizeSiteAssetPayload,
  type EditableGalleryFrameItem,
  type SiteAssetKey,
  type SiteAssetsMap,
} from './siteAssets';

function formatTimestamp(ts: unknown): { text: string; ms: number } {
  if (ts instanceof Timestamp) {
    const date = ts.toDate();
    return {
      text: date.toLocaleString('ar-DZ', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      ms: date.getTime(),
    };
  }
  return { text: 'الآن', ms: Date.now() };
}

export function subscribeWorkshopConfig(
  onUpdate: (config: WorkshopConfig) => void
): Unsubscribe {
  const path = `${WORKSHOP_COLLECTION}/${WORKSHOP_DOC_ID}`;
  const docRef = doc(db, WORKSHOP_COLLECTION, WORKSHOP_DOC_ID);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onUpdate(CURRENT_WORKSHOP);
        return;
      }
      const data = snapshot.data();
      const merged = sanitizeWorkshopPayload({
        ...CURRENT_WORKSHOP,
        ...data,
        slots:
          Array.isArray(data.slots) && data.slots.length === 2
            ? [data.slots[0], data.slots[1]]
            : CURRENT_WORKSHOP.slots,
      } as WorkshopConfig);
      onUpdate(merged);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveWorkshopConfig(
  workshop: WorkshopConfig
): Promise<void> {
  const path = `${WORKSHOP_COLLECTION}/${WORKSHOP_DOC_ID}`;
  const clean = sanitizeWorkshopPayload(workshop);
  try {
    await setDoc(doc(db, WORKSHOP_COLLECTION, WORKSHOP_DOC_ID), {
      ...clean,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export interface CreateRegistrationInput {
  firstName: string;
  lastName: string;
  phone: string;
  instagram: string;
  gmail: string;
  workshopTitle: string;
  selectedSlotIds: string[];
  selectedSlotLabels: string[];
  artworkChoice: ArtworkChoice;
  artworkNote?: string;
  uploadedImageUrl: string;
}

export async function createRegistration(
  input: CreateRegistrationInput
): Promise<string> {
  try {
    const payload: Record<string, unknown> = {
      firstName: input.firstName.trim().slice(0, 80),
      lastName: input.lastName.trim().slice(0, 80),
      phone: input.phone.trim().slice(0, 24),
      instagram: input.instagram.trim().slice(0, 60),
      gmail: input.gmail.trim().slice(0, 120),
      workshopTitle: input.workshopTitle.trim().slice(0, 120),
      selectedSlotIds: input.selectedSlotIds.slice(0, 2),
      selectedSlotLabels: input.selectedSlotLabels.slice(0, 2),
      artworkChoice: input.artworkChoice,
      uploadedImageUrl: input.uploadedImageUrl.slice(0, 350000),
      createdAt: serverTimestamp(),
    };
    if (input.artworkNote && input.artworkNote.trim().length > 0) {
      payload.artworkNote = input.artworkNote.trim().slice(0, 200);
    }

    const docRef = await addDoc(
      collection(db, REGISTRATIONS_COLLECTION),
      payload
    );
    return docRef.id;
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.CREATE,
      REGISTRATIONS_COLLECTION
    );
  }
}

export function subscribeRegistrations(
  onUpdate: (items: RegistrationRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, REGISTRATIONS_COLLECTION),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: RegistrationRecord[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        const ts = formatTimestamp(d.createdAt);
        return {
          id: docSnap.id,
          firstName: String(d.firstName ?? ''),
          lastName: String(d.lastName ?? ''),
          phone: String(d.phone ?? ''),
          instagram: String(d.instagram ?? ''),
          gmail: String(d.gmail ?? ''),
          workshopTitle: String(d.workshopTitle ?? ''),
          selectedSlotIds: Array.isArray(d.selectedSlotIds)
            ? d.selectedSlotIds.map(String)
            : [],
          selectedSlotLabels: Array.isArray(d.selectedSlotLabels)
            ? d.selectedSlotLabels.map(String)
            : [],
          artworkChoice: (d.artworkChoice ?? 'hand-draw') as ArtworkChoice,
          artworkNote: d.artworkNote ? String(d.artworkNote) : undefined,
          uploadedImageUrl: String(d.uploadedImageUrl ?? ''),
          createdAtText: ts.text,
          createdAtMs: ts.ms,
        };
      });
      onUpdate(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, REGISTRATIONS_COLLECTION);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export async function deleteRegistration(id: string): Promise<void> {
  const path = `${REGISTRATIONS_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, REGISTRATIONS_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeReviews(
  onUpdate: (items: ReviewRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, REVIEWS_COLLECTION));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: ReviewRecord[] = snapshot.docs
        .map((docSnap) => {
          const d = docSnap.data();
          const ts = formatTimestamp(d.createdAt);
          return {
            id: docSnap.id,
            name: String(d.name ?? ''),
            text: String(d.text ?? ''),
            photo: normalizePublicAssetPath(String(d.photo ?? '')),
            approved: Boolean(d.approved),
            createdAtText: ts.text,
            createdAtMs: ts.ms,
          };
        })
        .sort((a, b) => (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0));
      onUpdate(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, REVIEWS_COLLECTION);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export function subscribeApprovedReviews(
  onUpdate: (items: ReviewRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, REVIEWS_COLLECTION),
    where('approved', '==', true)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: ReviewRecord[] = snapshot.docs
        .map((docSnap) => {
          const d = docSnap.data();
          const ts = formatTimestamp(d.createdAt);
          return {
            id: docSnap.id,
            name: String(d.name ?? ''),
            text: String(d.text ?? ''),
            photo: normalizePublicAssetPath(String(d.photo ?? '')),
            approved: true,
            createdAtText: ts.text,
            createdAtMs: ts.ms,
          };
        })
        .sort((a, b) => (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0));
      onUpdate(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, REVIEWS_COLLECTION);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export async function submitPublicReview(input: {
  name: string;
  text: string;
  photo: string;
}): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, REVIEWS_COLLECTION), {
      name: input.name.trim().slice(0, 80),
      text: input.text.trim().slice(0, 1000),
      photo: normalizePublicAssetPath(input.photo).slice(0, 350000),
      approved: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, REVIEWS_COLLECTION);
  }
}

export async function createReview(input: {
  name: string;
  text: string;
  photo: string;
  approved: boolean;
}): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, REVIEWS_COLLECTION), {
      name: input.name.trim().slice(0, 80),
      text: input.text.trim().slice(0, 1000),
      photo: normalizePublicAssetPath(input.photo).slice(0, 350000),
      approved: Boolean(input.approved),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, REVIEWS_COLLECTION);
  }
}

export async function setReviewApproved(
  id: string,
  approved: boolean
): Promise<void> {
  const path = `${REVIEWS_COLLECTION}/${id}`;
  try {
    await updateDoc(doc(db, REVIEWS_COLLECTION, id), {
      approved,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateReviewPhoto(
  id: string,
  photo: string
): Promise<void> {
  const path = `${REVIEWS_COLLECTION}/${id}`;
  try {
    await updateDoc(doc(db, REVIEWS_COLLECTION, id), {
      photo: normalizePublicAssetPath(photo).slice(0, 350000),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteReview(id: string): Promise<void> {
  const path = `${REVIEWS_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, REVIEWS_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeSiteAssets(
  onUpdate: (state: { assets: SiteAssetsMap; gallerySeeded: boolean }) => void
): Unsubscribe {
  const q = query(collection(db, SITE_ASSETS_COLLECTION));

  return onSnapshot(
    q,
    (snapshot) => {
      const docs = snapshot.docs.map(
        (docSnap) => docSnap.data() as Record<string, unknown>
      );
      onUpdate(mergeSiteAssets(docs));
    },
    (error) => {
      onUpdate({
        assets: getDefaultSiteAssetsMap(),
        gallerySeeded: false,
      });
      handleFirestoreError(error, OperationType.LIST, SITE_ASSETS_COLLECTION);
    }
  );
}

export async function saveSiteAsset(input: {
  key: SiteAssetKey;
  label?: string;
  src: string;
  alt?: string;
}): Promise<void> {
  const clean = sanitizeSiteAssetPayload(input);
  const path = `${SITE_ASSETS_COLLECTION}/${clean.key}`;
  try {
    await setDoc(doc(db, SITE_ASSETS_COLLECTION, clean.key), {
      ...clean,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function resetSiteAsset(key: SiteAssetKey): Promise<void> {
  const path = `${SITE_ASSETS_COLLECTION}/${key}`;
  try {
    await deleteDoc(doc(db, SITE_ASSETS_COLLECTION, key));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeGalleryItems(
  onUpdate: (items: EditableGalleryFrameItem[]) => void
): Unsubscribe {
  const q = query(collection(db, GALLERY_ITEMS_COLLECTION));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: EditableGalleryFrameItem[] = snapshot.docs
        .map((docSnap, idx) => {
          const d = docSnap.data() as Record<string, unknown>;
          return sanitizeGalleryItemPayload(
            {
              id: docSnap.id,
              src: String(d.src ?? ''),
              title: String(d.title ?? ''),
              category:
                d.category === 'كواليس الورشة'
                  ? 'كواليس الورشة'
                  : 'لوحة كينوسايجا',
              aspectClass: String(d.aspectClass ?? ''),
              sizeSpanClass: String(d.sizeSpanClass ?? ''),
              offsetClass: String(d.offsetClass ?? ''),
              rotationDeg: Number(d.rotationDeg ?? 0),
              stringDropPx: Number(d.stringDropPx ?? 34),
              frameColor: String(d.frameColor ?? '#6b4e31'),
              orderIndex: Number(d.orderIndex ?? idx),
            },
            idx
          );
        })
        .sort((a, b) => a.orderIndex - b.orderIndex);
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, GALLERY_ITEMS_COLLECTION);
    }
  );
}

export async function ensureStarterGallerySeeded(
  alreadySeeded: boolean,
  overrideOrExclude?: {
    updatedItem?: EditableGalleryFrameItem;
    excludeId?: string;
  }
): Promise<void> {
  if (alreadySeeded) return;
  try {
    const batch = writeBatch(db);
    GALLERY_WALL_ITEMS.forEach((starter, idx) => {
      if (overrideOrExclude?.excludeId === starter.id) return;
      const source =
        overrideOrExclude?.updatedItem?.id === starter.id
          ? overrideOrExclude.updatedItem
          : starter;
      const clean = sanitizeGalleryItemPayload(
        {
          ...source,
          orderIndex: idx,
        },
        idx
      );
      batch.set(doc(db, GALLERY_ITEMS_COLLECTION, clean.id), {
        ...clean,
        updatedAt: serverTimestamp(),
      });
    });

    batch.set(doc(db, SITE_ASSETS_COLLECTION, GALLERY_SEEDED_KEY), {
      key: GALLERY_SEEDED_KEY,
      label: 'حالة تهيئة المعرض',
      src: 'seeded',
      alt: 'seeded',
      updatedAt: serverTimestamp(),
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, GALLERY_ITEMS_COLLECTION);
  }
}

export async function saveGalleryItem(
  item: EditableGalleryFrameItem
): Promise<void> {
  const clean = sanitizeGalleryItemPayload(item, item.orderIndex);
  const path = `${GALLERY_ITEMS_COLLECTION}/${clean.id}`;
  try {
    await setDoc(doc(db, GALLERY_ITEMS_COLLECTION, clean.id), {
      ...clean,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteGalleryItem(id: string): Promise<void> {
  const path = `${GALLERY_ITEMS_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, GALLERY_ITEMS_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function checkDynamicAdminAccess(email: string): Promise<boolean> {
  const normalized = normalizeAdminEmail(email);
  if (!normalized) return false;
  const path = `${ADMINS_COLLECTION}/${normalized}`;
  try {
    const snap = await getDoc(doc(db, ADMINS_COLLECTION, normalized));
    return snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeAdminMembers(
  onUpdate: (items: AdminMemberRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, ADMINS_COLLECTION));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: AdminMemberRecord[] = snapshot.docs
        .map((docSnap) => {
          const d = docSnap.data();
          const ts = formatTimestamp(d.createdAt);
          return {
            email: normalizeAdminEmail(String(d.email ?? docSnap.id)),
            name: String(d.name ?? ''),
            addedBy: normalizeAdminEmail(String(d.addedBy ?? '')),
            createdAtText: ts.text,
            createdAtMs: ts.ms,
          };
        })
        .sort((a, b) => b.createdAtMs - a.createdAtMs);
      onUpdate(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, ADMINS_COLLECTION);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export async function addAdminMember(input: {
  email: string;
  name?: string;
  addedBy: string;
}): Promise<void> {
  const normalizedEmail = normalizeAdminEmail(input.email);
  const normalizedAddedBy = normalizeAdminEmail(input.addedBy);
  const path = `${ADMINS_COLLECTION}/${normalizedEmail}`;
  try {
    await setDoc(doc(db, ADMINS_COLLECTION, normalizedEmail), {
      email: normalizedEmail,
      name: String(input.name ?? '').trim().slice(0, 80),
      addedBy: normalizedAddedBy,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeAdminMember(email: string): Promise<void> {
  const normalizedEmail = normalizeAdminEmail(email);
  const path = `${ADMINS_COLLECTION}/${normalizedEmail}`;
  try {
    await deleteDoc(doc(db, ADMINS_COLLECTION, normalizedEmail));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
