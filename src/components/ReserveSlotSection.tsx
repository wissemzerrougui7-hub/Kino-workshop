import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Check,
  ExternalLink,
  ImageUp,
  Instagram,
  MapPin,
  PenTool,
  RotateCcw,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { HankoStamp } from './HankoStamp';
import {
  KINO_INSTAGRAM,
  formatSeatsLeft,
  type WorkshopConfig,
} from '../utils/theme';
import {
  ARTWORK_TILE_OPTIONS,
  formatRegistrationSuccessMessage,
  normalizeInstagramHandle,
  pickRandomSurpriseArtwork,
  validateRegistrationForm,
  type ArtworkChoice,
  type RegistrationErrors,
  type RegistrationFieldKey,
} from '../utils/registration';
import { compressImageFileToDataUrl } from '../utils/adminHelpers';
import { createRegistration } from '../utils/firestoreService';
import { playSoftClick, playSurpriseChime } from '../utils/soundEffects';

interface ReserveSlotSectionProps {
  workshop: WorkshopConfig;
  selectedSlotIds: string[];
  onToggleSlot: (slotId: string) => void;
}

const ARTWORK_ICONS: Record<ArtworkChoice, React.ReactNode> = {
  'hand-draw': <PenTool className="w-5 h-5" aria-hidden="true" />,
  'upload-image': <ImageUp className="w-5 h-5" aria-hidden="true" />,
  'surprise-me': <Sparkles className="w-5 h-5" aria-hidden="true" />,
};

export const ReserveSlotSection: React.FC<ReserveSlotSectionProps> = ({
  workshop,
  selectedSlotIds,
  onToggleSlot,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [gmail, setGmail] = useState('');
  const [artworkChoice, setArtworkChoice] =
    useState<ArtworkChoice>('hand-draw');
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [artworkPreviewUrl, setArtworkPreviewUrl] = useState<string | null>(
    null
  );
  const [kinusaigaPreview, setKinusaigaPreview] = useState<{
    previewImageUrl: string;
    summaryAr: string;
    regionCount: number;
  } | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [surpriseArtwork, setSurpriseArtwork] = useState<string>(() =>
    pickRandomSurpriseArtwork()
  );
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedSummary, setSubmittedSummary] = useState<{
    message: string;
    fullName: string;
    slotsText: string;
    artworkText: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRequestSeqRef = useRef(0);
  const previewAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      previewAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!artworkFile) {
      setArtworkPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(artworkFile);
    setArtworkPreviewUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [artworkFile]);

  const clearFieldError = (field: RegistrationFieldKey) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const requestKinusaigaPreview = async (file: File) => {
    const requestSeq = ++previewRequestSeqRef.current;
    previewAbortRef.current?.abort();
    const controller = new AbortController();
    previewAbortRef.current = controller;
    const timeoutId = window.setTimeout(() => controller.abort(), 28000);

    setIsGeneratingPreview(true);
    setPreviewError(null);
    try {
      const compressedDataUrl = await compressImageFileToDataUrl(file);
      if (requestSeq !== previewRequestSeqRef.current) return;

      const response = await fetch('/api/kinusaiga-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: compressedDataUrl,
          mimeType: 'image/jpeg',
          themeKey: workshop.themeKey,
        }),
        signal: controller.signal,
      });

      const payload = (await response.json().catch(() => ({}))) as {
        previewImageUrl?: string;
        summaryAr?: string;
        regionCount?: number;
        error?: string;
      };

      if (requestSeq !== previewRequestSeqRef.current) return;

      if (!response.ok || !payload.previewImageUrl) {
        setKinusaigaPreview(null);
        setPreviewError(
          payload.error ??
            'تعذّر إنشاء معاينة الكينوسايجا حالياً. يمكنك المتابعة بطلب التسجيل بشكل عادي.'
        );
        return;
      }

      setKinusaigaPreview({
        previewImageUrl: payload.previewImageUrl,
        summaryAr: payload.summaryAr ?? 'باترون كينوسايجا مبسّط',
        regionCount: payload.regionCount ?? 12,
      });
    } catch (err) {
      if (requestSeq !== previewRequestSeqRef.current) return;
      setKinusaigaPreview(null);
      const isTimeout = err instanceof DOMException && err.name === 'AbortError';
      setPreviewError(
        isTimeout
          ? 'استغرقت المعاينة وقتاً أطول من المعتاد. اضغطي "أعيدي رسم الباترون" للمحاولة مجدداً.'
          : 'تعذّر الاتصال بالخادم لتوليد المعاينة. تحقّقي من الاتصال وجرّبي مجدداً.'
      );
    } finally {
      window.clearTimeout(timeoutId);
      if (requestSeq === previewRequestSeqRef.current) {
        setIsGeneratingPreview(false);
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      previewRequestSeqRef.current += 1;
      previewAbortRef.current?.abort();
      setArtworkFile(null);
      setKinusaigaPreview(null);
      setPreviewError(null);
      setIsGeneratingPreview(false);
      return;
    }
    if (!file.type.startsWith('image/')) {
      previewRequestSeqRef.current += 1;
      setArtworkFile(null);
      setKinusaigaPreview(null);
      setPreviewError(null);
      setIsGeneratingPreview(false);
      setErrors((prev) => ({
        ...prev,
        artworkFile: 'من فضلك اختاري ملف صورة صحيح (JPG أو PNG أو WebP)',
      }));
      return;
    }
    setArtworkFile(file);
    setKinusaigaPreview(null);
    clearFieldError('artworkFile');
    void requestKinusaigaPreview(file);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    const validationErrors = validateRegistrationForm(
      {
        firstName,
        lastName,
        phone,
        instagram,
        gmail,
        selectedSlotIds,
        artworkChoice,
        artworkFileName: artworkFile?.name ?? null,
      },
      workshop.slots.map((s) => s.id)
    );

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstErrorFieldId: Record<RegistrationFieldKey, string> = {
        firstName: 'reg-first-name',
        lastName: 'reg-last-name',
        phone: 'reg-phone',
        instagram: 'reg-instagram',
        gmail: 'reg-gmail',
        selectedSlotIds: `reg-slot-chip-${workshop.slots[0].id}`,
        artworkFile: 'reg-artwork-file',
      };
      const firstKey = Object.keys(validationErrors)[0] as
        | RegistrationFieldKey
        | undefined;
      if (firstKey) {
        const el = document.getElementById(firstErrorFieldId[firstKey]);
        el?.focus({ preventScroll: true });
      }
      return;
    }

    const chosenSlotObjects = workshop.slots.filter((s) =>
      selectedSlotIds.includes(s.id)
    );
    const selectedSlotLabels = chosenSlotObjects.map(
      (s) => `${s.weekday} ${s.dayNumber} ${s.month} (${s.time})`
    );
    const slotsText = selectedSlotLabels.join(' و ');

    const chosenTile = ARTWORK_TILE_OPTIONS.find(
      (opt) => opt.id === artworkChoice
    );
    const artworkText =
      artworkChoice === 'upload-image' && artworkFile
        ? `${chosenTile?.title ?? 'نبعث صورة'} (${artworkFile.name})`
        : artworkChoice === 'surprise-me'
        ? `${chosenTile?.title ?? 'فاجئوني'} — ${surpriseArtwork}`
        : chosenTile?.title ?? 'نرسم لوحتي بيدي';

    setErrors({});
    setIsSubmitting(true);

    try {
      let uploadedImageUrl = '';
      if (artworkChoice === 'upload-image' && artworkFile) {
        uploadedImageUrl = await compressImageFileToDataUrl(artworkFile);
      }

      const normalizedHandle = `@${normalizeInstagramHandle(instagram)}`;

      await createRegistration({
        firstName,
        lastName,
        phone,
        instagram: normalizedHandle,
        gmail,
        workshopTitle: workshop.title,
        selectedSlotIds: chosenSlotObjects.map((s) => s.id),
        selectedSlotLabels,
        artworkChoice,
        artworkNote:
          artworkChoice === 'surprise-me'
            ? surpriseArtwork
            : artworkChoice === 'upload-image' && artworkFile
            ? artworkFile.name
            : undefined,
        uploadedImageUrl,
      });

      playSurpriseChime();
      setSubmittedSummary({
        message: formatRegistrationSuccessMessage(firstName),
        fullName: `${firstName.trim()} ${lastName.trim()}`,
        slotsText,
        artworkText,
      });
    } catch {
      setSubmitError(
        'تعذّر إرسال الطلب حالياً. تأكدي من الاتصال بالإنترنت وحاولي مجدداً.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmission = () => {
    setSubmittedSummary(null);
    setFirstName('');
    setLastName('');
    setPhone('');
    setInstagram('');
    setGmail('');
    setArtworkChoice('hand-draw');
    setArtworkFile(null);
    setKinusaigaPreview(null);
    setPreviewError(null);
    setIsGeneratingPreview(false);
    setSurpriseArtwork(pickRandomSurpriseArtwork());
    setErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const inputBaseClass = (hasError: boolean) =>
    `w-full min-h-[46px] px-3.5 py-2.5 rounded-[4px] bg-[#faf9f5] dark:bg-[#182215] text-[#2d3f27] dark:text-[#f2eee2] text-base border transition-colors placeholder:text-[#55734a]/55 dark:placeholder:text-[#a9bf9c]/50 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#2d3f27] dark:focus-visible:outline-[#a9bf9c] ${
      hasError
        ? 'border-[#b8322a] dark:border-[#ff8a82] bg-[#b8322a]/[0.03] dark:bg-[#b8322a]/10'
        : 'border-[#55734a]/35 dark:border-[#a9bf9c]/35 hover:border-[#2d3f27]/65 dark:hover:border-[#a9bf9c]/75 focus:border-[#2d3f27] dark:focus:border-[#f2eee2]'
    }`;

  return (
    <section
      id="reserve"
      aria-labelledby="heading-reserve"
      className="relative overflow-x-clip py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 bg-[var(--kino-surface-cream)] kino-linen-weave kino-tucked-seam"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 'some' }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-4xl mx-auto"
      >
        {/* Section Header */}
        <div className="flex flex-wrap items-baseline justify-between gap-4 pb-6 border-b border-dashed border-[#55734a]/30 dark:border-[#a9bf9c]/30">
          <div className="flex items-baseline gap-3">
            <span
              className="kino-accent-transition text-base font-bold tabular-nums"
              style={{ color: 'var(--kino-accent)' }}
            >
              ٠٥
            </span>
            <h2
              id="heading-reserve"
              className="text-[28px] sm:text-[32px] leading-snug font-bold text-[#2d3f27] dark:text-[#f2eee2]"
            >
              سجّلي بلاصتك
            </h2>
          </div>

          <span className="font-jp text-sm tracking-wider text-[#55734a] dark:text-[#a9bf9c]">
            ご予約・お申し込み
          </span>
        </div>

        {/* Paper Card with Japanese Washi-Tape Strip */}
        <div className="relative mt-12">
          {/* Washi-Tape Strip holding the paper card */}
          <div
            aria-hidden="true"
            className="kino-accent-transition pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 z-10 w-44 sm:w-52 h-8 -rotate-[1.6deg] shadow-[0_3px_8px_rgba(45,63,39,0.18)]"
            style={{
              backgroundColor: 'var(--kino-accent-soft)',
              backgroundImage:
                'repeating-linear-gradient(115deg, rgba(250,249,245,0.48) 0px, rgba(250,249,245,0.48) 6px, transparent 6px, transparent 13px)',
              clipPath:
                'polygon(3% 0%, 97% 0%, 100% 18%, 97% 36%, 100% 54%, 97% 74%, 100% 92%, 96% 100%, 4% 100%, 0% 84%, 3% 65%, 0% 45%, 3% 26%, 0% 10%)',
              borderTop: '1px solid rgba(45,63,39,0.16)',
              borderBottom: '1px solid rgba(45,63,39,0.16)',
            }}
          />

          <div className="relative rounded-[4px] border border-[#d6cebc] dark:border-[#4b5f42] bg-[#fffdf9] dark:bg-[#243220] px-5 py-8 sm:px-9 sm:py-10 shadow-[0_14px_34px_rgba(45,63,39,0.11)]">
            {/* Subtle top paper stitch margin */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-3 rounded-[2px] border border-dashed border-[#55734a]/18 dark:border-[#a9bf9c]/20"
            />

            <div className="relative">
              {submittedSummary ? (
                <div
                  role="status"
                  aria-live="polite"
                  data-testid="registration-success-panel"
                  className="py-6 sm:py-8 text-center space-y-6"
                >
                  <div className="flex justify-center">
                    <HankoStamp text="キノ" size="md" />
                  </div>

                  <div className="space-y-2 max-w-xl mx-auto">
                    <h3
                      data-testid="registration-success-message"
                      className="text-2xl sm:text-[26px] font-bold text-[#2d3f27] dark:text-[#f2eee2] leading-relaxed"
                    >
                      {submittedSummary.message}
                    </h3>
                    <p className="text-base text-[#3a4f32] dark:text-[#d2decb]">
                      احتفظي بمعلومات تسجيلك للمراجعة عند تأكيد الورشة:
                    </p>
                  </div>

                  <div className="max-w-lg mx-auto rounded-[4px] border border-dashed border-[#55734a]/35 dark:border-[#a9bf9c]/40 bg-[#faf9f5] dark:bg-[#182215] p-4 sm:p-5 text-right space-y-2 text-sm sm:text-base text-[#2d3f27] dark:text-[#f2eee2]">
                    <p>
                      <span className="text-[#55734a] dark:text-[#a9bf9c] font-semibold">
                        المشتركة:{' '}
                      </span>
                      <strong>{submittedSummary.fullName}</strong>
                    </p>
                    <p>
                      <span className="text-[#55734a] dark:text-[#a9bf9c] font-semibold">
                        الورشة والموعد:{' '}
                      </span>
                      <strong>
                        {workshop.title} — {submittedSummary.slotsText}
                      </strong>
                    </p>
                    <p>
                      <span className="text-[#55734a] dark:text-[#a9bf9c] font-semibold">
                        لوحتك:{' '}
                      </span>
                      <strong>{submittedSummary.artworkText}</strong>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      data-testid="registration-another-btn"
                      onClick={handleResetSubmission}
                      className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 text-sm sm:text-base font-bold rounded-[4px] border-2 border-dashed border-[#55734a]/50 dark:border-[#a9bf9c]/50 text-[#2d3f27] dark:text-[#f2eee2] bg-[#faf9f5] dark:bg-[#182215] hover:border-[#2d3f27] dark:hover:border-[#f2eee2] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2d3f27] dark:focus-visible:outline-[#a9bf9c]"
                    >
                      <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>تسجيل طلب جديد</span>
                    </button>

                    <a
                      href={KINO_INSTAGRAM.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => playSoftClick()}
                      className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 text-sm sm:text-base font-bold rounded-[4px] border border-dashed border-[#55734a]/45 dark:border-[#a9bf9c]/45 text-[#2d3f27] dark:text-[#f2eee2] hover:border-[var(--kino-accent)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2d3f27] dark:focus-visible:outline-[#a9bf9c]"
                    >
                      <Instagram className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>تواصلي معنا على إنستغرام</span>
                    </a>
                  </div>
                </div>
              ) : (
                <form
                  noValidate
                  onSubmit={handleSubmit}
                  className="space-y-6"
                  aria-label="استمارة التسجيل في الورشة"
                >
                  {/* Card Intro Row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-dashed border-[#55734a]/25 dark:border-[#a9bf9c]/25">
                    <p className="text-base sm:text-[18px] text-[#3a4f32] dark:text-[#d2decb]">
                      عمّري معلوماتك تحت باش تحجزي بلاصتك في الورشة مع صحباتك.
                    </p>
                    <div className="shrink-0">
                      <HankoStamp text="受付" size="sm" />
                    </div>
                  </div>

                  {/* 1 & 2: الاسم + اللقب */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="reg-first-name"
                        className="block text-sm sm:text-base font-bold text-[#2d3f27] dark:text-[#f2eee2]"
                      >
                        الاسم <span className="text-[#b8322a] dark:text-[#ff928a]">*</span>
                      </label>
                      <input
                        id="reg-first-name"
                        name="firstName"
                        type="text"
                        autoComplete="given-name"
                        value={firstName}
                        onChange={(e) => {
                          setFirstName(e.target.value);
                          clearFieldError('firstName');
                        }}
                        aria-invalid={Boolean(errors.firstName)}
                        aria-describedby={
                          errors.firstName ? 'reg-first-name-error' : undefined
                        }
                        placeholder="مثلاً: سارة"
                        className={inputBaseClass(Boolean(errors.firstName))}
                      />
                      {errors.firstName && (
                        <p
                          id="reg-first-name-error"
                          role="alert"
                          className="text-xs sm:text-sm font-semibold text-[#b8322a] dark:text-[#ff928a]"
                        >
                          {errors.firstName}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="reg-last-name"
                        className="block text-sm sm:text-base font-bold text-[#2d3f27] dark:text-[#f2eee2]"
                      >
                        اللقب <span className="text-[#b8322a] dark:text-[#ff928a]">*</span>
                      </label>
                      <input
                        id="reg-last-name"
                        name="lastName"
                        type="text"
                        autoComplete="family-name"
                        value={lastName}
                        onChange={(e) => {
                          setLastName(e.target.value);
                          clearFieldError('lastName');
                        }}
                        aria-invalid={Boolean(errors.lastName)}
                        aria-describedby={
                          errors.lastName ? 'reg-last-name-error' : undefined
                        }
                        placeholder="مثلاً: بن علي"
                        className={inputBaseClass(Boolean(errors.lastName))}
                      />
                      {errors.lastName && (
                        <p
                          id="reg-last-name-error"
                          role="alert"
                          className="text-xs sm:text-sm font-semibold text-[#b8322a] dark:text-[#ff928a]"
                        >
                          {errors.lastName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 3: رقم الهاتف (LTR input) */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="reg-phone"
                      className="block text-sm sm:text-base font-bold text-[#2d3f27] dark:text-[#f2eee2]"
                    >
                      رقم الهاتف <span className="text-[#b8322a] dark:text-[#ff928a]">*</span>
                    </label>
                    <input
                      id="reg-phone"
                      name="phone"
                      type="tel"
                      dir="ltr"
                      inputMode="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        clearFieldError('phone');
                      }}
                      aria-invalid={Boolean(errors.phone)}
                      aria-describedby={
                        errors.phone ? 'reg-phone-error' : undefined
                      }
                      placeholder="0550 12 34 56"
                      className={`${inputBaseClass(
                        Boolean(errors.phone)
                      )} text-left tabular-nums`}
                    />
                    {errors.phone && (
                      <p
                        id="reg-phone-error"
                        role="alert"
                        className="text-xs sm:text-sm font-semibold text-[#b8322a] dark:text-[#ff928a]"
                      >
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* 4 & 5: Instagram + Gmail */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="reg-instagram"
                        className="block text-sm sm:text-base font-bold text-[#2d3f27] dark:text-[#f2eee2]"
                      >
                        Instagram <span className="text-[#b8322a] dark:text-[#ff928a]">*</span>
                      </label>
                      <input
                        id="reg-instagram"
                        name="instagram"
                        type="text"
                        dir="ltr"
                        value={instagram}
                        onChange={(e) => {
                          setInstagram(e.target.value);
                          clearFieldError('instagram');
                        }}
                        aria-invalid={Boolean(errors.instagram)}
                        aria-describedby={
                          errors.instagram ? 'reg-instagram-error' : undefined
                        }
                        placeholder="@kino.craft"
                        className={`${inputBaseClass(
                          Boolean(errors.instagram)
                        )} text-left`}
                      />
                      {errors.instagram && (
                        <p
                          id="reg-instagram-error"
                          role="alert"
                          className="text-xs sm:text-sm font-semibold text-[#b8322a] dark:text-[#ff928a]"
                        >
                          {errors.instagram}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="reg-gmail"
                        className="block text-sm sm:text-base font-bold text-[#2d3f27] dark:text-[#f2eee2]"
                      >
                        Gmail <span className="text-[#b8322a] dark:text-[#ff928a]">*</span>
                      </label>
                      <input
                        id="reg-gmail"
                        name="gmail"
                        type="email"
                        dir="ltr"
                        autoComplete="email"
                        value={gmail}
                        onChange={(e) => {
                          setGmail(e.target.value);
                          clearFieldError('gmail');
                        }}
                        aria-invalid={Boolean(errors.gmail)}
                        aria-describedby={
                          errors.gmail ? 'reg-gmail-error' : undefined
                        }
                        placeholder="name@gmail.com"
                        className={`${inputBaseClass(
                          Boolean(errors.gmail)
                        )} text-left`}
                      />
                      {errors.gmail && (
                        <p
                          id="reg-gmail-error"
                          role="alert"
                          className="text-xs sm:text-sm font-semibold text-[#b8322a] dark:text-[#ff928a]"
                        >
                          {errors.gmail}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 6: Current Workshop Name + Checkable Chips for Both Slots */}
                  <div className="pt-2 space-y-3 border-t border-dashed border-[#55734a]/25 dark:border-[#a9bf9c]/25">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm sm:text-base font-bold text-[#2d3f27] dark:text-[#f2eee2]">
                        الموعد في{' '}
                        <span
                          className="kino-accent-transition"
                          style={{ color: 'var(--kino-accent)' }}
                        >
                          {workshop.title}
                        </span>{' '}
                        <span className="text-xs sm:text-sm font-normal text-[#55734a] dark:text-[#a9bf9c]">
                          ({formatSeatsLeft(workshop.seatsLeft)} ·
                          تقدري تختاري واحد أو الاثنين)
                        </span>
                      </p>
                    </div>

                    {(workshop.locationName || workshop.locationMapsUrl) && (
                      <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[#3a4f32] dark:text-[#d2decb]">
                        <span className="inline-flex items-center gap-1.5 font-semibold">
                          <MapPin
                            className="w-4 h-4 shrink-0"
                            style={{ color: 'var(--kino-accent)' }}
                            aria-hidden="true"
                          />
                          <span>
                            المكان: {workshop.locationName || 'عنابة'}
                          </span>
                        </span>
                        {workshop.locationMapsUrl && (
                          <a
                            href={workshop.locationMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-testid="reserve-maps-link"
                            onClick={() => playSoftClick()}
                            className="inline-flex items-center gap-1 min-h-[44px] px-2 py-1 rounded-[4px] font-bold text-[#2d3f27] dark:text-[#f2eee2] underline decoration-dashed underline-offset-4 hover:text-[var(--kino-accent)] transition-colors"
                          >
                            <span>افتحي في قوقل ماب</span>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          </a>
                        )}
                      </div>
                    )}

                    <div
                      role="group"
                      aria-label="اختيار مواعيد الورشة"
                      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                    >
                      {workshop.slots.map((slot) => {
                        const isChecked = selectedSlotIds.includes(slot.id);
                        return (
                          <button
                            key={slot.id}
                            id={`reg-slot-chip-${slot.id}`}
                            type="button"
                            role="checkbox"
                            aria-checked={isChecked}
                            data-testid={`reg-slot-chip-${slot.id}`}
                            onClick={() => {
                              playSoftClick();
                              onToggleSlot(slot.id);
                              clearFieldError('selectedSlotIds');
                            }}
                            className={`kino-accent-transition flex flex-wrap items-center justify-between gap-2 min-h-[50px] px-3 sm:px-4 py-2.5 rounded-[4px] border-2 text-right text-sm sm:text-base cursor-pointer active:scale-[0.98] transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2d3f27] dark:focus-visible:outline-[#a9bf9c] ${
                              isChecked
                                ? 'bg-[#faf9f5] text-[#2d3f27] font-bold shadow-sm'
                                : 'bg-[#faf9f5]/50 dark:bg-[#182215] text-[#3a4f32] dark:text-[#d2decb] border-[#55734a]/30 dark:border-[#a9bf9c]/35 hover:border-[#2d3f27] dark:hover:border-[#f2eee2]'
                            }`}
                            style={
                              isChecked
                                ? {
                                    borderColor: 'var(--kino-accent)',
                                    backgroundColor: 'var(--kino-accent-soft)',
                                  }
                                : undefined
                            }
                          >
                            <span className="flex items-center gap-2">
                              <span
                                aria-hidden="true"
                                className={`w-5 h-5 rounded-[3px] border flex items-center justify-center shrink-0 transition-colors ${
                                  isChecked
                                    ? 'border-[#2d3f27] bg-[#2d3f27] text-[#faf9f5]'
                                    : 'border-[#55734a]/60 dark:border-[#a9bf9c]/55 bg-[#fffdf9] dark:bg-[#243220]'
                                }`}
                              >
                                {isChecked && <Check className="w-3.5 h-3.5" />}
                              </span>
                              <span>
                                {slot.weekday} {slot.dayNumber} {slot.month}
                              </span>
                            </span>
                            <span
                              className={`text-xs sm:text-sm tabular-nums shrink-0 ${
                                isChecked
                                  ? 'text-[#3a4f32]'
                                  : 'text-[#3a4f32] dark:text-[#a9bf9c]'
                              }`}
                            >
                              {slot.time}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {errors.selectedSlotIds && (
                      <p
                        role="alert"
                        className="text-xs sm:text-sm font-semibold text-[#b8322a] dark:text-[#ff928a]"
                      >
                        {errors.selectedSlotIds}
                      </p>
                    )}
                  </div>

                  {/* 7: لوحتك with 3 Tile Options */}
                  <div className="pt-2 space-y-3 border-t border-dashed border-[#55734a]/25 dark:border-[#a9bf9c]/25">
                    <p className="text-sm sm:text-base font-bold text-[#2d3f27] dark:text-[#f2eee2]">
                      لوحتك
                    </p>

                    <div
                      role="radiogroup"
                      aria-label="اختيار لوحتك للورشة"
                      className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                    >
                      {ARTWORK_TILE_OPTIONS.map((option) => {
                        const isSelected = artworkChoice === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            data-testid={`reg-artwork-tile-${option.id}`}
                            onClick={() => {
                              if (option.id === 'surprise-me') {
                                playSurpriseChime();
                              } else {
                                playSoftClick();
                              }
                              setArtworkChoice(option.id);
                              clearFieldError('artworkFile');
                              if (option.id === 'surprise-me') {
                                setSurpriseArtwork(pickRandomSurpriseArtwork());
                              }
                            }}
                            className={`kino-accent-transition flex flex-col items-start justify-between gap-2 min-h-[96px] p-3.5 rounded-[4px] border-2 text-right cursor-pointer transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2d3f27] dark:focus-visible:outline-[#a9bf9c] ${
                              isSelected
                                ? 'bg-[#faf9f5] dark:bg-[#182215] text-[#2d3f27] dark:text-[#f2eee2] -translate-y-0.5 shadow-sm'
                                : 'bg-[#faf9f5]/60 dark:bg-[#1b2718] text-[#3a4f32] dark:text-[#d2decb] border-[#55734a]/30 dark:border-[#a9bf9c]/35 hover:border-[#2d3f27] dark:hover:border-[#f2eee2]'
                            }`}
                            style={
                              isSelected
                                ? { borderColor: 'var(--kino-accent)' }
                                : undefined
                            }
                          >
                            <span
                              className="kino-accent-transition inline-flex items-center justify-center w-9 h-9 rounded-[4px] border border-dashed"
                              style={
                                isSelected
                                  ? {
                                      backgroundColor: 'var(--kino-accent)',
                                      color: 'var(--kino-accent-contrast)',
                                      borderColor: 'var(--kino-accent)',
                                    }
                                  : {
                                      backgroundColor: '#eef2ea',
                                      color: '#3a4f32',
                                      borderColor: 'rgba(85,115,74,0.35)',
                                    }
                              }
                            >
                              {ARTWORK_ICONS[option.id]}
                            </span>
                            <span className="text-sm sm:text-base font-bold leading-snug">
                              {option.title}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Conditional detail panel below tiles */}
                    {artworkChoice === 'upload-image' ? (
                      <div
                        data-testid="reg-upload-box"
                        className="rounded-[4px] border-2 border-dashed border-[#55734a]/45 dark:border-[#a9bf9c]/45 bg-[#faf9f5] dark:bg-[#182215] p-4 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <input
                            ref={fileInputRef}
                            id="reg-artwork-file"
                            data-testid="reg-artwork-file-input"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="peer sr-only"
                          />
                          <label
                            htmlFor="reg-artwork-file"
                            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-[4px] bg-[#2d3f27] text-[#faf9f5] text-sm font-bold cursor-pointer hover:bg-[#3a4f32] transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#2d3f27] dark:peer-focus-visible:outline-[#a9bf9c]"
                          >
                            <Upload className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>
                              {artworkFile
                                ? 'تبديل الصورة'
                                : 'اختاري صورة من جهازك'}
                            </span>
                          </label>
                          <span className="text-xs sm:text-sm text-[#55734a] dark:text-[#a9bf9c]">
                            {artworkFile
                              ? artworkFile.name
                              : 'PNG أو JPG أو WebP'}
                          </span>
                        </div>

                        {artworkPreviewUrl && artworkFile && (
                          <div className="space-y-4 pt-3 border-t border-dashed border-[#55734a]/25 dark:border-[#a9bf9c]/25">
                            <div className="flex items-center gap-3">
                              <img
                                src={artworkPreviewUrl}
                                alt="معاينة الصورة المرفوعة"
                                className="w-16 h-16 object-cover rounded-[4px] border border-[#55734a]/35 shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-[#2d3f27] dark:text-[#f2eee2] truncate">
                                  {artworkFile.name}
                                </p>
                                <p className="text-xs text-[#55734a] dark:text-[#a9bf9c]">
                                  الصورة جاهزة للإرسال مع الطلب
                                </p>
                              </div>
                              <button
                                type="button"
                                aria-label="إزالة الصورة المختارة"
                                onClick={() => {
                                  previewRequestSeqRef.current += 1;
                                  previewAbortRef.current?.abort();
                                  setArtworkFile(null);
                                  setKinusaigaPreview(null);
                                  setPreviewError(null);
                                  setIsGeneratingPreview(false);
                                  if (fileInputRef.current) {
                                    fileInputRef.current.value = '';
                                  }
                                }}
                                className="inline-flex items-center justify-center w-11 h-11 rounded-[4px] border border-[#55734a]/35 dark:border-[#a9bf9c]/40 text-[#3a4f32] dark:text-[#d2decb] hover:text-[#b8322a] hover:border-[#b8322a] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2d3f27] dark:focus-visible:outline-[#a9bf9c]"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Kinusaiga Simplified Fabric Pattern Preview */}
                            <div
                              data-testid="kinusaiga-ai-preview"
                              className="rounded-[5px] border border-dashed border-[#55734a]/45 dark:border-[#a9bf9c]/45 bg-[#eef2ea]/75 dark:bg-[#202d1c] p-3.5 sm:p-4 space-y-3"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="space-y-0.5">
                                  <p className="text-sm sm:text-base font-bold text-[#2d3f27] dark:text-[#f2eee2]">
                                    شوفي كيفاش تخرج لوحتك بالكينوسايجا
                                  </p>
                                  <p className="text-xs text-[#55734a] dark:text-[#a9bf9c]">
                                    تصوّر مبسّط بقطع قماش مسطّحة وخطوط قص واضحة على الخشب
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  data-testid="kinusaiga-regenerate-btn"
                                  disabled={isGeneratingPreview}
                                  onClick={() =>
                                    void requestKinusaigaPreview(artworkFile)
                                  }
                                  className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-[4px] border border-dashed border-[#55734a]/60 dark:border-[#a9bf9c]/50 bg-[#faf9f5] dark:bg-[#182215] text-xs sm:text-sm font-bold text-[#2d3f27] dark:text-[#f2eee2] hover:border-[#2d3f27] dark:hover:border-[#f2eee2] disabled:opacity-55 cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2d3f27] dark:focus-visible:outline-[#a9bf9c]"
                                >
                                  <RotateCcw
                                    className={`w-3.5 h-3.5 shrink-0 ${
                                      isGeneratingPreview ? 'animate-spin' : ''
                                    }`}
                                    aria-hidden="true"
                                  />
                                  <span>
                                    {isGeneratingPreview
                                      ? 'جاري التحضير...'
                                      : 'أعيدي رسم الباترون'}
                                  </span>
                                </button>
                              </div>

                              {isGeneratingPreview ? (
                                <div
                                  role="status"
                                  aria-live="polite"
                                  data-testid="kinusaiga-preview-loading"
                                  className="rounded-[4px] border border-dashed border-[#55734a]/40 dark:border-[#a9bf9c]/40 bg-[#faf9f5] dark:bg-[#182215] py-8 px-4 text-center space-y-2"
                                >
                                  <p className="text-sm font-bold text-[#2d3f27] dark:text-[#f2eee2]">
                                    جاري تبسيط صورتك إلى قطع قماش وخطوط قص...
                                  </p>
                                  <p className="text-xs text-[#55734a] dark:text-[#a9bf9c]">
                                    انتظري ثواني قليلة باش تشوفي الباترون المقترح
                                  </p>
                                </div>
                              ) : previewError ? (
                                <div
                                  role="alert"
                                  data-testid="kinusaiga-preview-error"
                                  className="rounded-[4px] border border-[#b8322a]/35 bg-[#fffdf9] dark:bg-[#182215] p-3.5 space-y-2"
                                >
                                  <p className="text-xs sm:text-sm font-semibold text-[#b8322a] dark:text-[#ff928a]">
                                    {previewError}
                                  </p>
                                </div>
                              ) : kinusaigaPreview ? (
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                                  <div className="sm:col-span-6">
                                    <div className="mx-auto max-w-[260px] rounded-[6px] border-[7px] border-[#6b4e31] bg-[#faf9f5] p-1.5 shadow-[0_10px_24px_rgba(45,63,39,0.2)]">
                                      <img
                                        src={kinusaigaPreview.previewImageUrl}
                                        alt={`معاينة لوحة كينوسايجا: ${kinusaigaPreview.summaryAr}`}
                                        data-testid="kinusaiga-preview-img"
                                        className="w-full aspect-square object-contain block rounded-[2px] bg-[#faf9f5]"
                                      />
                                    </div>
                                  </div>
                                  <div className="sm:col-span-6 space-y-2 text-right">
                                    <p className="text-sm font-bold text-[#2d3f27] dark:text-[#f2eee2]">
                                      {kinusaigaPreview.summaryAr}
                                    </p>
                                    <p className="text-xs sm:text-sm text-[#3a4f32] dark:text-[#d2decb]">
                                      مقسّمة إلى{' '}
                                      <strong className="tabular-nums">
                                        {kinusaigaPreview.regionCount}
                                      </strong>{' '}
                                      قطعة قماش مسطّحة بخطوط قص واضحة لتسهيل التثبيت في الورشة.
                                    </p>
                                    <p className="text-xs text-[#55734a] dark:text-[#a9bf9c]">
                                      تقدري تبعثي طلبك دوكا، وفريقنا يجهّزلك الباترون على الخشب نهار الورشة.
                                    </p>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        )}

                        {errors.artworkFile && (
                          <p
                            role="alert"
                            className="text-xs sm:text-sm font-semibold text-[#b8322a] dark:text-[#ff928a]"
                          >
                            {errors.artworkFile}
                          </p>
                        )}
                      </div>
                    ) : artworkChoice === 'surprise-me' ? (
                      <div
                        data-testid="reg-surprise-box"
                        className="rounded-[4px] border border-dashed border-[#55734a]/40 dark:border-[#a9bf9c]/40 bg-[#faf9f5] dark:bg-[#182215] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3"
                      >
                        <p className="text-sm text-[#3a4f32] dark:text-[#d2decb]">
                          فكرة مقترحة للورشة:{' '}
                          <strong className="text-[#2d3f27] dark:text-[#f2eee2]">
                            {surpriseArtwork}
                          </strong>
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            setSurpriseArtwork(pickRandomSurpriseArtwork())
                          }
                          className="inline-flex items-center min-h-[44px] px-2 rounded-[4px] text-xs sm:text-sm font-bold underline underline-offset-4 text-[#55734a] dark:text-[#a9bf9c] hover:text-[#2d3f27] dark:hover:text-[#f2eee2] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2d3f27] dark:focus-visible:outline-[#a9bf9c]"
                        >
                          بدّلي الفكرة
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm text-[#55734a] dark:text-[#a9bf9c]">
                        {ARTWORK_TILE_OPTIONS[0].hint}
                      </p>
                    )}
                  </div>

                  {/* Submit Error */}
                  {submitError && (
                    <p
                      role="alert"
                      className="text-sm font-semibold text-[#b8322a] dark:text-[#ff928a] bg-[#b8322a]/[0.05] border border-[#b8322a]/30 rounded-[4px] px-3.5 py-2.5"
                    >
                      {submitError}
                    </p>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2 space-y-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      data-testid="reg-submit-btn"
                      className="kino-accent-transition w-full min-h-[50px] px-6 py-3 text-base sm:text-lg font-bold rounded-[4px] border-2 border-dashed border-[#faf9f5]/45 shadow-sm hover:-translate-y-0.5 disabled:opacity-65 disabled:cursor-not-allowed transition-transform duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2d3f27] dark:focus-visible:outline-[#a9bf9c]"
                      style={{
                        backgroundColor: 'var(--kino-accent)',
                        color: 'var(--kino-accent-contrast)',
                      }}
                    >
                      {isSubmitting ? 'جاري إرسال طلبك...' : 'ابعثي طلب التسجيل'}
                    </button>

                    <div className="flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm text-[#55734a] dark:text-[#a9bf9c]">
                      <span>عندك سؤال قبل الحجز؟</span>
                      <a
                        href={KINO_INSTAGRAM.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid="reserve-instagram-link"
                        onClick={() => playSoftClick()}
                        className="inline-flex items-center gap-1.5 min-h-[44px] px-2 rounded-[4px] font-bold text-[#2d3f27] dark:text-[#f2eee2] underline decoration-dashed underline-offset-4 hover:text-[var(--kino-accent)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2d3f27] dark:focus-visible:outline-[#a9bf9c]"
                      >
                        <Instagram size={15} aria-hidden="true" />
                        <span>راسلينا على إنستغرام</span>
                        <span dir="ltr">{KINO_INSTAGRAM.handle}</span>
                      </a>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
