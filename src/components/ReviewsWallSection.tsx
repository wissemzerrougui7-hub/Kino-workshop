import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Check, MessageSquareHeart, Upload, X } from 'lucide-react';
import {
  REVIEWS_WALL_CONTENT,
  STARTER_APPROVED_REVIEWS,
  getReviewNoteVisuals,
  validatePublicReviewForm,
  type PublicReviewValidationErrors,
} from '../utils/galleryAndReviews';
import {
  compressImageFileToDataUrl,
  type ReviewRecord,
} from '../utils/adminHelpers';
import {
  submitPublicReview,
  subscribeApprovedReviews,
} from '../utils/firestoreService';
import { playSurpriseChime } from '../utils/soundEffects';
import { resolveAssetUrl } from '../utils/theme';

interface ReviewsWallSectionProps {
  starterReviewPhotos?: Partial<Record<string, string>>;
}

export const ReviewsWallSection: React.FC<ReviewsWallSectionProps> = ({
  starterReviewPhotos,
}) => {
  const [approvedReviews, setApprovedReviews] = useState<ReviewRecord[]>([]);
  const [brokenPhotos, setBrokenPhotos] = useState<Record<string, boolean>>({});
  const [lightboxPhoto, setLightboxPhoto] = useState<{
    src: string;
    name: string;
  } | null>(null);

  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<PublicReviewValidationErrors>({});
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedName, setSubmittedName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = subscribeApprovedReviews(
      (items) => {
        setApprovedReviews(items);
      },
      () => {
        // Keep starter approved notes if Firestore stream cannot subscribe
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!lightboxPhoto) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setLightboxPhoto(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxPhoto]);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setPhotoError(null);
    if (!file) {
      setPhotoFile(null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setPhotoFile(null);
      setPhotoError('من فضلك اختاري ملف صورة صحيح (JPG أو PNG أو WebP)');
      return;
    }
    setPhotoFile(file);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    const validation = validatePublicReviewForm({ name, text });
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setIsSubmitting(true);
    try {
      let compressedPhoto = '';
      if (photoFile) {
        compressedPhoto = await compressImageFileToDataUrl(photoFile);
      }

      await submitPublicReview({
        name,
        text,
        photo: compressedPhoto,
      });

      playSurpriseChime();
      setSubmittedName(name.trim());
      setName('');
      setText('');
      setPhotoFile(null);
      setErrors({});
      setPhotoError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch {
      setSubmitError(
        'تعذّر إرسال رأيك حالياً. تأكدي من الاتصال بالإنترنت وحاولي مجدداً.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayedReviews =
    approvedReviews.length > 0
      ? approvedReviews
      : STARTER_APPROVED_REVIEWS.map((review) => ({
          ...review,
          photo: starterReviewPhotos?.[review.id] || review.photo,
        }));

  return (
    <section
      id={REVIEWS_WALL_CONTENT.id}
      aria-labelledby={`heading-${REVIEWS_WALL_CONTENT.id}`}
      className="relative overflow-x-clip bg-[var(--kino-surface-sand)] kino-linen-weave kino-tucked-seam py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 'some' }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4 pb-8 border-b border-dashed border-[#55734a]/30 dark:border-[#a9bf9c]/30"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div className="flex items-baseline gap-3">
              <span
                className="kino-accent-transition text-base font-bold tabular-nums"
                style={{ color: 'var(--kino-accent)' }}
              >
                {REVIEWS_WALL_CONTENT.indexLabel}
              </span>
              <h2
                id={`heading-${REVIEWS_WALL_CONTENT.id}`}
                className="text-[28px] sm:text-[32px] leading-snug font-bold text-[#2d3f27] dark:text-[#f2eee2]"
              >
                {REVIEWS_WALL_CONTENT.title}
              </h2>
            </div>
            <span className="font-jp text-sm tracking-wider text-[#55734a] dark:text-[#a9bf9c]">
              {REVIEWS_WALL_CONTENT.subtitleJp}
            </span>
          </div>

          <p className="text-[18px] leading-[1.8] text-[#3a4f32] dark:text-[#d2decb] max-w-2xl">
            {REVIEWS_WALL_CONTENT.lead}
          </p>
        </motion.div>

        {/* Pinned Notes Board */}
        <div
          data-testid="reviews-pinboard"
          className="mt-10 sm:mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 sm:gap-8 items-start"
        >
          {displayedReviews.map((review, index) => {
            const visual = getReviewNoteVisuals(index);
            const resolvedPhoto = review.photo
              ? resolveAssetUrl(review.photo)
              : '';
            const photoBrokenKey = `${review.id}:${resolvedPhoto}`;
            const hasBrokenPhoto = Boolean(brokenPhotos[photoBrokenKey]);

            return (
              <motion.article
                key={review.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 'some' }}
                transition={{
                  duration: 0.4,
                  delay: Math.min(index * 0.05, 0.25),
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={
                  {
                    '--kino-tilt': `${visual.rotationDeg}deg`,
                    '--kino-note-bg': visual.noteBg,
                    '--kino-note-bg-dark': visual.noteBgDark,
                  } as React.CSSProperties
                }
                className="kino-pinned-note relative pt-7 px-5 pb-5 rounded-[3px] bg-[var(--kino-note-bg)] dark:bg-[var(--kino-note-bg-dark)] border border-[#ded6c1] dark:border-[#4b5f42] shadow-[0_12px_26px_rgba(45,63,39,0.12)] hover:shadow-[0_18px_36px_rgba(45,63,39,0.2)] space-y-4"
              >
                {/* Coloured Pushpin */}
                <div
                  aria-hidden="true"
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none"
                >
                  <span
                    className="w-5 h-5 rounded-full border border-black/15 shadow-[0_3px_5px_rgba(30,24,18,0.35)] relative"
                    style={{
                      background: `radial-gradient(circle at 35% 30%, ${visual.pinHighlight}, ${visual.pinColor} 68%)`,
                    }}
                  />
                  <span className="w-2 h-1 -mt-0.5 rounded-full bg-black/15 blur-[1px]" />
                </div>

                {/* Optional Participant Work Photo */}
                {resolvedPhoto && !hasBrokenPhoto && (
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxPhoto({ src: resolvedPhoto, name: review.name })
                    }
                    aria-label={`معاينة صورة عمل ${review.name}`}
                    className="block w-full overflow-hidden rounded-[2px] border border-[#d6cebc] dark:border-[#4b5f42] bg-[#eef2ea] dark:bg-[#182215] aspect-[4/3] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2d3f27] dark:focus-visible:outline-[#a9bf9c]"
                  >
                    <img
                      src={resolvedPhoto}
                      alt={`لوحة من ورشة كينو للمشاركة ${review.name}`}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      decoding="async"
                      onError={() =>
                        setBrokenPhotos((prev) => ({
                          ...prev,
                          [photoBrokenKey]: true,
                        }))
                      }
                      className="w-full h-full object-cover block"
                    />
                  </button>
                )}

                <blockquote className="text-[17px] leading-[1.75] text-[#2d3f27] dark:text-[#f2eee2]">
                  «{review.text}»
                </blockquote>

                <footer className="pt-3 border-t border-dashed border-[#55734a]/30 dark:border-[#a9bf9c]/30 flex items-center justify-between gap-2 text-sm text-[#55734a] dark:text-[#a9bf9c]">
                  <strong className="text-[#2d3f27] dark:text-[#f2eee2] font-bold">
                    {review.name}
                  </strong>
                  <span>{review.createdAtText}</span>
                </footer>
              </motion.article>
            );
          })}
        </div>

        {/* Small Participant Review Submission Card */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 'some' }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="mt-14 sm:mt-16 max-w-2xl mx-auto rounded-[6px] border-2 border-dashed border-[#55734a]/40 dark:border-[#a9bf9c]/40 bg-[#fffdf9] dark:bg-[#243220] p-5 sm:p-7 shadow-[0_12px_28px_rgba(45,63,39,0.08)]"
        >
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-dashed border-[#55734a]/25 dark:border-[#a9bf9c]/25">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-[#2d3f27] dark:text-[#f2eee2] flex items-center gap-2">
                <MessageSquareHeart
                  className="w-5 h-5 shrink-0"
                  style={{ color: 'var(--kino-accent)' }}
                  aria-hidden="true"
                />
                <span>شاركينا رأيك</span>
              </h3>
              <p className="text-sm sm:text-base text-[#3a4f32] dark:text-[#d2decb]">
                حضرتي ورشة معانا؟ ابعتي كلمتك وصورة لوحتك، وراح تتعلّق في الجدار غير يوافق عليها الفريق.
              </p>
            </div>
          </div>

          {submittedName ? (
            <div
              role="status"
              data-testid="review-submitted-status"
              className="mt-5 rounded-[4px] border border-dashed border-[#55734a]/50 dark:border-[#a9bf9c]/45 bg-[#eef2ea] dark:bg-[#1a2417] p-5 text-center space-y-3"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#3a4f32] text-[#faf9f5]">
                <Check className="w-5 h-5" aria-hidden="true" />
              </div>
              <p className="text-base sm:text-lg font-bold text-[#2d3f27] dark:text-[#f2eee2]">
                شكراً {submittedName}! وصلنا رأيك، وراح يبان في الجدار غير يوافق عليه الفريق.
              </p>
              <button
                type="button"
                onClick={() => setSubmittedName(null)}
                className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-[4px] border border-dashed border-[#55734a]/60 dark:border-[#a9bf9c]/55 text-sm font-bold text-[#2d3f27] dark:text-[#f2eee2] hover:bg-[#faf9f5] dark:hover:bg-[#243220] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2d3f27] dark:focus-visible:outline-[#a9bf9c]"
              >
                إرسال ملاحظة أخرى
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              aria-label="نموذج إرسال رأي مشاركة في الورشة"
              className="mt-5 space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="review-name"
                    className="block text-sm font-bold text-[#2d3f27] dark:text-[#f2eee2] mb-1.5"
                  >
                    الاسم <span className="text-[#b8322a] dark:text-[#ff928a]">*</span>
                  </label>
                  <input
                    id="review-name"
                    type="text"
                    required
                    maxLength={80}
                    placeholder="مثلاً: أمينة"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) {
                        setErrors((prev) => ({ ...prev, name: undefined }));
                      }
                    }}
                    aria-invalid={Boolean(errors.name)}
                    className={`w-full min-h-[44px] px-3.5 py-2 rounded-[4px] bg-[#faf9f5] dark:bg-[#182215] text-[#2d3f27] dark:text-[#f2eee2] placeholder:text-[#55734a]/55 dark:placeholder:text-[#a9bf9c]/50 border focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#2d3f27] dark:focus-visible:outline-[#a9bf9c] ${
                      errors.name
                        ? 'border-[#b8322a] dark:border-[#ff8a82]'
                        : 'border-[#55734a]/35 dark:border-[#a9bf9c]/35 focus:border-[#2d3f27] dark:focus:border-[#f2eee2]'
                    }`}
                  />
                  {errors.name && (
                    <p role="alert" className="mt-1 text-xs font-semibold text-[#b8322a] dark:text-[#ff928a]">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="review-photo-input"
                    className="block text-sm font-bold text-[#2d3f27] dark:text-[#f2eee2] mb-1.5"
                  >
                    صورة لوحتك (اختياري)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      id="review-photo-input"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="peer sr-only"
                    />
                    <label
                      htmlFor="review-photo-input"
                      className="flex-1 inline-flex items-center justify-center gap-2 min-h-[44px] px-3 py-2 rounded-[4px] border border-dashed border-[#55734a]/50 dark:border-[#a9bf9c]/45 bg-[#faf9f5] dark:bg-[#182215] text-sm font-semibold text-[#2d3f27] dark:text-[#f2eee2] hover:border-[#2d3f27] dark:hover:border-[#f2eee2] cursor-pointer truncate peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#2d3f27] dark:peer-focus-visible:outline-[#a9bf9c]"
                    >
                      <Upload className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">
                        {photoFile ? photoFile.name : 'اختاري صورة من جهازك'}
                      </span>
                    </label>
                    {photoFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        aria-label="إزالة الصورة المختارة"
                        className="inline-flex items-center justify-center w-11 h-11 rounded-[4px] border border-[#b8322a]/40 dark:border-[#ff8a82]/50 text-[#b8322a] dark:text-[#ff928a] hover:bg-[#b8322a]/10 cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2d3f27] dark:focus-visible:outline-[#a9bf9c]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {photoError && (
                    <p role="alert" className="mt-1 text-xs font-semibold text-[#b8322a] dark:text-[#ff928a]">
                      {photoError}
                    </p>
                  )}
                </div>
              </div>

              {photoPreviewUrl && (
                <div className="flex items-center gap-3 p-2.5 rounded-[4px] bg-[#eef2ea] dark:bg-[#1a2417] border border-[#55734a]/25 dark:border-[#a9bf9c]/30">
                  <img
                    src={photoPreviewUrl}
                    alt="معاينة الصورة المرفقة"
                    className="w-14 h-14 rounded-[3px] object-cover border border-[#6b4e31]/40 shrink-0"
                  />
                  <span className="text-xs sm:text-sm text-[#3a4f32] dark:text-[#d2decb] truncate">
                    جاهزة للإرسال مع ملاحظتك
                  </span>
                </div>
              )}

              <div>
                <label
                  htmlFor="review-text"
                  className="block text-sm font-bold text-[#2d3f27] dark:text-[#f2eee2] mb-1.5"
                >
                  رأيك في الورشة <span className="text-[#b8322a] dark:text-[#ff928a]">*</span>
                </label>
                <textarea
                  id="review-text"
                  rows={3}
                  required
                  maxLength={1000}
                  placeholder="احكيلنا كيفاش جازت الورشة معاك..."
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    if (errors.text) {
                      setErrors((prev) => ({ ...prev, text: undefined }));
                    }
                  }}
                  aria-invalid={Boolean(errors.text)}
                  className={`w-full px-3.5 py-2.5 rounded-[4px] bg-[#faf9f5] dark:bg-[#182215] text-[#2d3f27] dark:text-[#f2eee2] placeholder:text-[#55734a]/55 dark:placeholder:text-[#a9bf9c]/50 border focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#2d3f27] dark:focus-visible:outline-[#a9bf9c] ${
                    errors.text
                      ? 'border-[#b8322a] dark:border-[#ff8a82]'
                      : 'border-[#55734a]/35 dark:border-[#a9bf9c]/35 focus:border-[#2d3f27] dark:focus:border-[#f2eee2]'
                  }`}
                />
                {errors.text && (
                  <p role="alert" className="mt-1 text-xs font-semibold text-[#b8322a] dark:text-[#ff928a]">
                    {errors.text}
                  </p>
                )}
              </div>

              {submitError && (
                <p
                  role="alert"
                  className="text-sm font-semibold text-[#b8322a] dark:text-[#ff928a] bg-[#b8322a]/[0.06] border border-[#b8322a]/30 rounded-[4px] px-3 py-2"
                >
                  {submitError}
                </p>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  data-testid="review-submit-btn"
                  className="min-h-[46px] px-6 py-2.5 rounded-[4px] font-bold text-base border-2 border-dashed border-[#faf9f5]/70 shadow-xs hover:-translate-y-0.5 transition-transform duration-150 disabled:opacity-60 cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2d3f27] dark:focus-visible:outline-[#a9bf9c]"
                  style={{
                    backgroundColor: 'var(--kino-accent)',
                    color: 'var(--kino-accent-contrast)',
                  }}
                >
                  {isSubmitting ? 'جاري الإرسال...' : 'ابعتي رأيك'}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>

      {/* Review Photo Lightbox */}
      {lightboxPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`صورة مشاركة ${lightboxPhoto.name}`}
          onClick={() => setLightboxPhoto(null)}
          className="fixed inset-0 z-50 bg-[#1a2516]/85 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-lg w-full rounded-[6px] border-[6px] border-[#6b4e31] bg-[#fffdf9] dark:bg-[#1e291b] p-3 space-y-2.5"
          >
            <button
              type="button"
              onClick={() => setLightboxPhoto(null)}
              aria-label="إغلاق الصورة"
              className="absolute top-3 left-3 z-10 inline-flex items-center justify-center w-11 h-11 rounded-[4px] bg-[#2d3f27]/90 text-[#faf9f5] border border-dashed border-[#faf9f5]/70 hover:bg-[#2d3f27] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#faf9f5]"
            >
              <X size={20} aria-hidden="true" />
            </button>
            <img
              src={lightboxPhoto.src}
              alt={`صورة لوحة ${lightboxPhoto.name}`}
              referrerPolicy="no-referrer"
              decoding="async"
              className="w-full max-h-[70vh] object-contain rounded-[2px]"
            />
            <p className="text-sm font-bold text-[#2d3f27] dark:text-[#f2eee2] px-1">
              لوحة {lightboxPhoto.name}
            </p>
          </div>
        </div>
      )}
    </section>
  );
};
