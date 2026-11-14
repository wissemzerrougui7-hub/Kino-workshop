import React, { useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  CheckCircle2,
  Download,
  ExternalLink,
  LogOut,
  MapPin,
  Plus,
  RotateCcw,
  Save,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Upload,
  UserPlus,
  Users,
} from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import {
  ADMIN_EMAILS,
  isOwnerAdminEmail,
  normalizeAdminEmail,
  validateNewAdminEmail,
  type AdminMemberRecord,
} from '../utils/adminConfig';
import {
  compressImageFileToDataUrl,
  computeSlotCounts,
  generateRegistrationsCsv,
  getArtworkChoiceLabel,
  type RegistrationRecord,
  type ReviewRecord,
} from '../utils/adminHelpers';
import {
  addAdminMember,
  checkDynamicAdminAccess,
  createReview,
  deleteRegistration,
  deleteReview,
  removeAdminMember,
  resetSiteAsset,
  saveSiteAsset,
  saveWorkshopConfig,
  setReviewApproved,
  subscribeAdminMembers,
  subscribeRegistrations,
  subscribeReviews,
  subscribeSiteAssets,
  subscribeWorkshopConfig,
} from '../utils/firestoreService';
import {
  SITE_ASSET_SLOTS,
  getDefaultSiteAssetsMap,
  type SiteAssetRecord,
  type SiteAssetSlotMeta,
  type SiteAssetsMap,
} from '../utils/siteAssets';
import {
  CURRENT_WORKSHOP,
  KINO_LOGO_SRC,
  WORKSHOP_THEMES,
  getThemeCssVars,
  type WorkshopConfig,
  type WorkshopThemeId,
} from '../utils/theme';
import { HankoStamp } from './HankoStamp';

type AdminTab = 'registrations' | 'media' | 'workshop' | 'reviews' | 'team';

interface AdminPageProps {
  onNavigateHome: () => void;
}

const THEME_OPTIONS: WorkshopThemeId[] = ['forest', 'autumn', 'sakura', 'sun'];

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigateHome }) => {
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>('registrations');
  const [workshopDraft, setWorkshopDraft] =
    useState<WorkshopConfig>(CURRENT_WORKSHOP);
  const [workshopStatus, setWorkshopStatus] = useState<string | null>(null);
  const [workshopError, setWorkshopError] = useState<string | null>(null);
  const [isSavingWorkshop, setIsSavingWorkshop] = useState(false);

  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [siteAssets, setSiteAssets] = useState<SiteAssetsMap>(() =>
    getDefaultSiteAssetsMap()
  );
  const [mediaStatus, setMediaStatus] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);

  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewPhoto, setNewReviewPhoto] = useState('');
  const [newReviewApproved, setNewReviewApproved] = useState(true);
  const [reviewFormError, setReviewFormError] = useState<string | null>(null);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);

  const [checkingDynamicAdmin, setCheckingDynamicAdmin] = useState(false);
  const [isDynamicAdmin, setIsDynamicAdmin] = useState(false);
  const [adminMembers, setAdminMembers] = useState<AdminMemberRecord[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [teamStatus, setTeamStatus] = useState<string | null>(null);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    let active = true;
    if (!authReady || !user || !user.emailVerified || !user.email) {
      setIsDynamicAdmin(false);
      setCheckingDynamicAdmin(false);
      return;
    }
    if (isOwnerAdminEmail(user.email)) {
      setIsDynamicAdmin(true);
      setCheckingDynamicAdmin(false);
      return;
    }

    setCheckingDynamicAdmin(true);
    checkDynamicAdminAccess(user.email)
      .then((allowed) => {
        if (!active) return;
        setIsDynamicAdmin(allowed);
      })
      .catch(() => {
        if (!active) return;
        setIsDynamicAdmin(false);
      })
      .finally(() => {
        if (!active) return;
        setCheckingDynamicAdmin(false);
      });

    return () => {
      active = false;
    };
  }, [authReady, user]);

  const isAuthorizedAdmin = Boolean(
    user &&
      user.emailVerified &&
      (isOwnerAdminEmail(user.email) || isDynamicAdmin)
  );

  useEffect(() => {
    if (!authReady || !isAuthorizedAdmin) return;

    const unsubWorkshop = subscribeWorkshopConfig((liveConfig) => {
      setWorkshopDraft(liveConfig);
    });
    const unsubAssets = subscribeSiteAssets(({ assets }) => {
      setSiteAssets(assets);
    });
    const unsubRegs = subscribeRegistrations(
      (items) => {
        setRegistrations(items);
        setDataError(null);
      },
      (err) => {
        setDataError(err.message);
      }
    );
    const unsubReviews = subscribeReviews(
      (items) => {
        setReviews(items);
      },
      (err) => {
        setDataError(err.message);
      }
    );
    const unsubAdmins = subscribeAdminMembers(
      (items) => {
        setAdminMembers(items);
      },
      (err) => {
        setDataError(err.message);
      }
    );

    return () => {
      unsubWorkshop();
      unsubAssets();
      unsubRegs();
      unsubReviews();
      unsubAdmins();
    };
  }, [authReady, isAuthorizedAdmin]);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: unknown }).code ?? '')
          : '';
      if (code === 'auth/popup-blocked') {
        setAuthError(
          'المتصفح حجب نافذة تسجيل الدخول المنبثقة. اسمحي بالنوافذ المنبثقة لهذه الصفحة ثم أعيدي المحاولة.'
        );
      } else if (code === 'auth/popup-closed-by-user') {
        setAuthError('تم إغلاق نافذة تسجيل الدخول قبل إتمام العملية.');
      } else {
        setAuthError(
          err instanceof Error
            ? err.message
            : 'تعذّر تسجيل الدخول عبر Google. حاولي مجدداً.'
        );
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const handleExportCsv = () => {
    const csvContent = generateRegistrationsCsv(registrations);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `kino-registrations-${dateStamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleWorkshopImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setWorkshopError('من فضلك اختاري ملف صورة صحيح');
      return;
    }
    const compressedUrl = await compressImageFileToDataUrl(file);
    setWorkshopDraft((prev) => ({ ...prev, imageSrc: compressedUrl }));
    setWorkshopError(null);
  };

  const handleSaveWorkshop = async (event: React.FormEvent) => {
    event.preventDefault();
    setWorkshopStatus(null);
    setWorkshopError(null);
    setIsSavingWorkshop(true);
    try {
      await saveWorkshopConfig(workshopDraft);
      setWorkshopStatus('تم حفظ إعدادات الورشة وتحديث الموقع بنجاح.');
    } catch (err) {
      setWorkshopError(
        err instanceof Error ? err.message : 'تعذّر حفظ إعدادات الورشة.'
      );
    } finally {
      setIsSavingWorkshop(false);
    }
  };

  const handleAddReview = async (event: React.FormEvent) => {
    event.preventDefault();
    setReviewFormError(null);
    if (newReviewName.trim().length < 2 || newReviewText.trim().length < 2) {
      setReviewFormError('اكتبي اسم المشاركة ونص التقييم من فضلك.');
      return;
    }
    try {
      await createReview({
        name: newReviewName,
        text: newReviewText,
        photo: newReviewPhoto,
        approved: newReviewApproved,
      });
      setNewReviewName('');
      setNewReviewText('');
      setNewReviewPhoto('');
      setNewReviewApproved(true);
    } catch (err) {
      setReviewFormError(
        err instanceof Error ? err.message : 'تعذّر إضافة التقييم.'
      );
    }
  };

  const handleAddAdminMember = async (event: React.FormEvent) => {
    event.preventDefault();
    setTeamError(null);
    setTeamStatus(null);

    const check = validateNewAdminEmail(
      newAdminEmail,
      adminMembers.map((m) => m.email)
    );
    if (!check.ok) {
      setTeamError(check.error);
      return;
    }

    setIsAddingAdmin(true);
    try {
      await addAdminMember({
        email: check.email,
        name: newAdminName,
        addedBy: user?.email ?? ADMIN_EMAILS[0],
      });
      setNewAdminEmail('');
      setNewAdminName('');
      setTeamStatus(
        `تمت إضافة ${check.email} إلى فريق الإدارة بنجاح. يمكنها الآن تسجيل الدخول بحساب Google.`
      );
    } catch (err) {
      setTeamError(
        err instanceof Error ? err.message : 'تعذّر إضافة المشرفة الجديدة.'
      );
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const handleRemoveAdminMember = async (email: string) => {
    setTeamError(null);
    setTeamStatus(null);
    try {
      await removeAdminMember(email);
      setTeamStatus(`تم سحب صلاحية الإدارة من ${email}.`);
    } catch (err) {
      setTeamError(
        err instanceof Error ? err.message : 'تعذّر حذف المشرفة من القائمة.'
      );
    }
  };

  const slotCounts = computeSlotCounts(registrations, workshopDraft.slots);
  const themeVars = getThemeCssVars(workshopDraft.themeKey);

  return (
    <div
      data-theme={workshopDraft.themeKey}
      style={themeVars as React.CSSProperties}
      className="min-h-screen bg-[#2d3f27] p-2 sm:p-4 text-[#2d3f27]"
    >
      <div className="kino-wood-frame mx-auto max-w-6xl min-h-[calc(100vh-1rem)] sm:min-h-[calc(100vh-2rem)] flex flex-col rounded-[8px] border-[5px] bg-[#faf9f5] kino-linen-weave overflow-hidden">
        {/* Top Admin Bar */}
        <header className="bg-[#384c31] text-[#faf9f5] px-3.5 sm:px-6 py-3.5 border-b border-dashed border-[#a9bf9c]/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="h-[44px] sm:h-[52px] w-14 sm:w-20 overflow-hidden rounded-[4px] bg-[#384c31] border border-dashed border-[#a9bf9c]/45 shrink-0 flex items-center justify-center">
              <img
                src={siteAssets.logo.src || KINO_LOGO_SRC}
                alt="شعار Kino"
                referrerPolicy="no-referrer"
                className="w-full h-[76px] sm:h-[90px] object-cover object-[50%_47%]"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold leading-snug truncate">
                لوحة إدارة Kino
              </h1>
              <p className="font-jp text-[11px] sm:text-xs text-[#a9bf9c] truncate">
                キノサイガ · 管理パネル
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onNavigateHome();
              }}
              className="inline-flex items-center justify-center min-h-[44px] px-3 sm:px-4 py-1.5 rounded-[4px] border border-dashed border-[#a9bf9c]/70 text-xs sm:text-sm font-bold text-[#faf9f5] hover:border-[#faf9f5] transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#faf9f5]"
            >
              العودة للموقع
            </a>
            {user && (
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 min-h-[44px] px-3 sm:px-4 py-1.5 rounded-[4px] bg-[#faf9f5] text-[#2d3f27] text-xs sm:text-sm font-bold hover:bg-[#eef2ea] cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#faf9f5]"
              >
                <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>خروج</span>
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 flex flex-col p-4 sm:p-8">
          {!authReady || checkingDynamicAdmin ? (
            <div className="py-16 text-center text-base text-[#3a4f32]">
              جاري التحقق من الجلسة...
            </div>
          ) : !user ? (
            /* Sign-In Card */
            <div
              data-testid="admin-login-card"
              className="w-full max-w-md mx-auto my-auto rounded-[6px] border-2 border-dashed border-[#55734a]/45 bg-[#fffdf9] p-6 sm:p-9 text-center space-y-5 shadow-[0_12px_28px_rgba(45,63,39,0.1)]"
            >
              <div className="flex justify-center">
                <HankoStamp text="キノ" size="md" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-[#2d3f27]">
                  دخول فريق الإدارة
                </h2>
                <p className="text-base text-[#3a4f32]">
                  سجّلي الدخول بحساب Google المصرّح له لتعديل صور الموقع
                  والمعرض، إدارة الورشة، متابعة التسجيلات، ومراجعة التقييمات.
                </p>
              </div>

              {authError && (
                <p
                  role="alert"
                  className="text-sm font-semibold text-[#b8322a] bg-[#b8322a]/[0.06] border border-[#b8322a]/30 rounded-[4px] px-3 py-2"
                >
                  {authError}
                </p>
              )}

              <button
                type="button"
                data-testid="admin-google-signin-btn"
                disabled={isSigningIn}
                onClick={handleGoogleSignIn}
                className="w-full min-h-[48px] px-4 sm:px-5 py-2.5 rounded-[4px] bg-[#2d3f27] text-[#faf9f5] text-sm sm:text-base font-bold border-2 border-dashed border-[#a9bf9c]/60 hover:bg-[#3a4f32] disabled:opacity-60 cursor-pointer transition-colors whitespace-nowrap"
              >
                {isSigningIn
                  ? 'جاري فتح نافذة Google...'
                  : 'تسجيل الدخول عبر Google'}
              </button>
            </div>
          ) : !isAuthorizedAdmin ? (
            /* Unauthorized User Guard */
            <div
              data-testid="admin-unauthorized-card"
              className="w-full max-w-lg mx-auto my-auto rounded-[6px] border-2 border-dashed border-[#b8322a]/45 bg-[#fffdf9] p-6 sm:p-9 text-center space-y-4"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-[4px] bg-[#b8322a]/10 text-[#b8322a] mx-auto">
                <ShieldAlert className="w-6 h-6" aria-hidden="true" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#2d3f27]">
                حساب غير مصرّح له بالإدارة
              </h2>
              <p className="text-base text-[#3a4f32]">
                الحساب الحالي (<span dir="ltr">{user.email}</span>) غير مدرج في
                قائمة بريد فريق العمل المصرّح له.
              </p>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2 rounded-[4px] bg-[#2d3f27] text-[#faf9f5] text-sm font-bold cursor-pointer"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                <span>تبديل الحساب</span>
              </button>
            </div>
          ) : (
            /* Authorized Team Dashboard */
            <div className="space-y-6" data-testid="admin-dashboard">
              {/* Top Info & Segmented Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-dashed border-[#55734a]/30">
                <div className="space-y-0.5">
                  <p className="text-sm text-[#55734a]">
                    مرحباً،{' '}
                    <strong className="text-[#2d3f27]" dir="ltr">
                      {user.email}
                    </strong>
                  </p>
                  <p className="text-xs text-[#55734a]">
                    الورشة النشطة: <strong>{workshopDraft.title}</strong>
                  </p>
                </div>

                <div
                  role="tablist"
                  aria-label="أقسام لوحة الإدارة"
                  className="flex flex-wrap items-center gap-2"
                >
                  {(
                    [
                      {
                        id: 'registrations',
                        label: `التسجيلات (${registrations.length})`,
                      },
                      {
                        id: 'media',
                        label: 'صور الموقع',
                      },
                      { id: 'workshop', label: 'تعديل الورشة' },
                      {
                        id: 'reviews',
                        label: `التقييمات (${reviews.length})`,
                      },
                      {
                        id: 'team',
                        label: `فريق الإدارة (${ADMIN_EMAILS.length + adminMembers.length})`,
                      },
                    ] as const
                  ).map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        data-testid={`admin-tab-${tab.id}`}
                        onClick={() => setActiveTab(tab.id)}
                        className={`min-h-[44px] px-4 py-2 rounded-[4px] text-sm sm:text-base font-bold border-2 transition-colors cursor-pointer whitespace-nowrap ${
                          isActive
                            ? 'bg-[#2d3f27] text-[#faf9f5] border-[#2d3f27]'
                            : 'bg-[#fffdf9] text-[#2d3f27] border-[#55734a]/35 hover:border-[#2d3f27]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {dataError && (
                <p
                  role="alert"
                  className="text-sm font-semibold text-[#b8322a] bg-[#b8322a]/[0.06] border border-[#b8322a]/30 rounded-[4px] px-4 py-3"
                >
                  {dataError}
                </p>
              )}

              {/* TAB 1: REGISTRATIONS TABLE + SLOT COUNTS + CSV EXPORT */}
              {activeTab === 'registrations' && (
                <div className="space-y-6">
                  {/* Counts per slot + CSV export */}
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-baseline gap-6 text-sm sm:text-base text-[#2d3f27]">
                      <span>
                        الإجمالي:{' '}
                        <strong className="tabular-nums text-lg">
                          {registrations.length}
                        </strong>
                      </span>
                      {slotCounts.map((sc) => (
                        <span
                          key={sc.slotId}
                          data-testid={`slot-count-${sc.slotId}`}
                        >
                          <span className="text-[#55734a]">{sc.label}: </span>
                          <strong className="tabular-nums text-lg">
                            {sc.count}
                          </strong>
                        </span>
                      ))}
                    </div>

                    <button
                      type="button"
                      data-testid="admin-export-csv-btn"
                      onClick={handleExportCsv}
                      disabled={registrations.length === 0}
                      className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-[4px] text-sm font-bold border-2 border-dashed border-[#2d3f27]/50 bg-[#fffdf9] text-[#2d3f27] hover:border-[#2d3f27] disabled:opacity-50 cursor-pointer whitespace-nowrap"
                    >
                      <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>تصدير CSV</span>
                    </button>
                  </div>

                  {/* Registrations Table */}
                  <div className="overflow-x-auto rounded-[4px] border border-[#d6cebc] bg-[#fffdf9]">
                    <table className="w-full text-right text-sm sm:text-base border-collapse">
                      <thead>
                        <tr className="border-b border-dashed border-[#55734a]/35 bg-[#eef2ea] text-[#2d3f27]">
                          <th className="py-3 px-3.5 font-bold whitespace-nowrap">
                            المشتركة
                          </th>
                          <th className="py-3 px-3.5 font-bold whitespace-nowrap">
                            رقم الهاتف
                          </th>
                          <th className="py-3 px-3.5 font-bold whitespace-nowrap">
                            Instagram
                          </th>
                          <th className="py-3 px-3.5 font-bold whitespace-nowrap">
                            Gmail
                          </th>
                          <th className="py-3 px-3.5 font-bold whitespace-nowrap">
                            المواعيد
                          </th>
                          <th className="py-3 px-3.5 font-bold whitespace-nowrap">
                            لوحتك
                          </th>
                          <th className="py-3 px-3.5 font-bold whitespace-nowrap">
                            التاريخ
                          </th>
                          <th className="py-3 px-3.5 font-bold whitespace-nowrap">
                            إجراء
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {registrations.length === 0 ? (
                          <tr>
                            <td
                              colSpan={8}
                              className="py-10 px-4 text-center text-[#55734a]"
                            >
                              لا توجد تسجيلات مسجّلة حتى الآن.
                            </td>
                          </tr>
                        ) : (
                          registrations.map((reg) => (
                            <tr
                              key={reg.id}
                              className="border-b border-[#55734a]/15 hover:bg-[#faf9f5]"
                            >
                              <td className="py-3 px-3.5 font-bold text-[#2d3f27] whitespace-nowrap">
                                {reg.firstName} {reg.lastName}
                              </td>
                              <td
                                className="py-3 px-3.5 tabular-nums whitespace-nowrap"
                                dir="ltr"
                              >
                                {reg.phone}
                              </td>
                              <td className="py-3 px-3.5 whitespace-nowrap" dir="ltr">
                                {reg.instagram}
                              </td>
                              <td className="py-3 px-3.5 whitespace-nowrap" dir="ltr">
                                {reg.gmail}
                              </td>
                              <td className="py-3 px-3.5 min-w-[180px]">
                                {reg.selectedSlotLabels.join(' · ')}
                              </td>
                              <td className="py-3 px-3.5 min-w-[170px]">
                                <div className="flex items-center gap-2.5">
                                  {reg.uploadedImageUrl && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setPreviewModalUrl(reg.uploadedImageUrl)
                                      }
                                      className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] shrink-0 rounded-[3px] overflow-hidden border border-[#55734a]/40 cursor-pointer"
                                      aria-label={`معاينة صورة ${reg.firstName}`}
                                    >
                                      <img
                                        src={reg.uploadedImageUrl}
                                        alt={`صورة لوحة ${reg.firstName}`}
                                        loading="lazy"
                                        decoding="async"
                                        className="w-11 h-11 object-cover block"
                                      />
                                    </button>
                                  )}
                                  <div className="space-y-0.5 text-xs sm:text-sm">
                                    <p className="font-semibold text-[#2d3f27]">
                                      {getArtworkChoiceLabel(reg.artworkChoice)}
                                    </p>
                                    {reg.artworkNote && (
                                      <p className="text-[#55734a]">
                                        {reg.artworkNote}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3.5 text-xs sm:text-sm text-[#55734a] whitespace-nowrap">
                                {reg.createdAtText}
                              </td>
                              <td className="py-3 px-3.5">
                                <button
                                  type="button"
                                  aria-label={`حذف تسجيل ${reg.firstName} ${reg.lastName}`}
                                  onClick={() => void deleteRegistration(reg.id)}
                                  className="inline-flex items-center justify-center w-11 h-11 rounded-[4px] border border-[#b8322a]/30 text-[#b8322a] hover:bg-[#b8322a]/10 cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: SITE IMAGES & GALLERY MANAGEMENT */}
              {activeTab === 'media' && (
                <div className="space-y-8" data-testid="admin-media-panel">
                  {mediaError && (
                    <p
                      role="alert"
                      className="text-sm font-semibold text-[#b8322a] bg-[#b8322a]/[0.06] border border-[#b8322a]/30 rounded-[4px] px-4 py-3"
                    >
                      {mediaError}
                    </p>
                  )}
                  {mediaStatus && (
                    <p
                      role="status"
                      className="text-sm font-semibold text-[#2d3f27] bg-[#eef2ea] border border-[#55734a]/40 rounded-[4px] px-4 py-3"
                    >
                      {mediaStatus}
                    </p>
                  )}

                  {/* Section A: Main Landing Page Image Slots */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h2 className="text-xl font-bold text-[#2d3f27]">
                        صور الواجهة والأقسام الرئيسية
                      </h2>
                      <p className="text-sm text-[#55734a]">
                        ارفعي صورة جديدة من جهازك أو اكتبي رابطاً ثم اضغطي حفظ؛
                        ستتغيّر مباشرةً على الصفحة الرئيسية للزوار.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {SITE_ASSET_SLOTS.map((slotMeta) => (
                        <SiteAssetAdminCard
                          key={slotMeta.key}
                          meta={slotMeta}
                          record={siteAssets[slotMeta.key]}
                          onZoom={setPreviewModalUrl}
                          onSave={async (nextSrc, nextAlt) => {
                            setMediaError(null);
                            setMediaStatus(null);
                            await saveSiteAsset({
                              key: slotMeta.key,
                              label: slotMeta.label,
                              src: nextSrc,
                              alt: nextAlt,
                            });
                            setMediaStatus(`تم تحديث «${slotMeta.label}» بنجاح.`);
                          }}
                          onReset={async () => {
                            setMediaError(null);
                            setMediaStatus(null);
                            await resetSiteAsset(slotMeta.key);
                            setMediaStatus(
                              `تم استرجاع الصورة الأصلية لـ «${slotMeta.label}».`
                            );
                          }}
                          onError={setMediaError}
                        />
                      ))}

                      {/* Quick sync card for the active workshop artwork */}
                      <div className="rounded-[6px] border border-[#d6cebc] bg-[#fffdf9] p-4 flex flex-col justify-between gap-3">
                        <div className="flex items-start gap-3.5">
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewModalUrl(workshopDraft.imageSrc)
                            }
                            aria-label="معاينة صورة الورشة الجاية"
                            className="w-20 h-20 shrink-0 rounded-[4px] overflow-hidden border border-[#6b4e31]/50 bg-[#eef2ea] cursor-pointer"
                          >
                            <img
                              src={workshopDraft.imageSrc}
                              alt={workshopDraft.imageAlt}
                              className="w-full h-full object-cover block"
                            />
                          </button>
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-bold text-[#2d3f27]">
                                صورة لوحة «الورشة الجاية»
                              </h3>
                              <span className="text-xs px-2 py-0.5 rounded-[3px] bg-[#eef2ea] text-[#3a4f32] border border-dashed border-[#55734a]/35">
                                {workshopDraft.title}
                              </span>
                            </div>
                            <p className="text-xs text-[#55734a]">
                              تظهر في قسم الورشة الحالية داخل الإطار الخشبي المائل.
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-dashed border-[#55734a]/20">
                          <label className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-[4px] bg-[#2d3f27] text-[#faf9f5] text-xs sm:text-sm font-bold cursor-pointer hover:bg-[#3a4f32]">
                            <Upload className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>تغيير صورة الورشة</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (!file.type.startsWith('image/')) {
                                  setMediaError('من فضلك اختاري ملف صورة صحيح.');
                                  return;
                                }
                                try {
                                  setMediaError(null);
                                  setMediaStatus(null);
                                  const compressed =
                                    await compressImageFileToDataUrl(file);
                                  const nextDraft = {
                                    ...workshopDraft,
                                    imageSrc: compressed,
                                  };
                                  setWorkshopDraft(nextDraft);
                                  await saveWorkshopConfig(nextDraft);
                                  setMediaStatus(
                                    'تم تغيير صورة الورشة الجاية وحفظها بنجاح.'
                                  );
                                } catch (err) {
                                  setMediaError(
                                    err instanceof Error
                                      ? err.message
                                      : 'تعذّر حفظ صورة الورشة.'
                                  );
                                }
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setActiveTab('workshop')}
                            className="inline-flex items-center min-h-[44px] px-3 py-2 rounded-[4px] border border-[#55734a]/40 text-xs sm:text-sm font-semibold text-[#2d3f27] hover:border-[#2d3f27] cursor-pointer"
                          >
                            باقي تفاصيل الورشة
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: EDIT WORKSHOP CONFIG */}
              {activeTab === 'workshop' && (
                <form
                  onSubmit={handleSaveWorkshop}
                  className="max-w-3xl space-y-5 rounded-[6px] border border-[#d6cebc] bg-[#fffdf9] p-5 sm:p-7"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="ws-title"
                        className="block text-sm font-bold text-[#2d3f27]"
                      >
                        عنوان الورشة
                      </label>
                      <input
                        id="ws-title"
                        type="text"
                        required
                        value={workshopDraft.title}
                        onChange={(e) =>
                          setWorkshopDraft((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        className="w-full min-h-[44px] px-3 py-2 rounded-[4px] border border-[#55734a]/40 bg-[#faf9f5]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="ws-theme-key"
                        className="block text-sm font-bold text-[#2d3f27]"
                      >
                        ثيم الألوان (Theme Key)
                      </label>
                      <select
                        id="ws-theme-key"
                        value={workshopDraft.themeKey}
                        onChange={(e) => {
                          const key = e.target.value as WorkshopThemeId;
                          setWorkshopDraft((prev) => ({
                            ...prev,
                            themeKey: key,
                            themeName: `ثيم ${WORKSHOP_THEMES[key].labelAr}`,
                          }));
                        }}
                        className="w-full min-h-[44px] px-3 py-2 rounded-[4px] border border-[#55734a]/40 bg-[#faf9f5]"
                      >
                        {THEME_OPTIONS.map((key) => (
                          <option key={key} value={key}>
                            {WORKSHOP_THEMES[key].labelAr} (
                            {WORKSHOP_THEMES[key].labelJp})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="ws-theme-name"
                        className="block text-sm font-bold text-[#2d3f27]"
                      >
                        اسم الثيم الظاهر
                      </label>
                      <input
                        id="ws-theme-name"
                        type="text"
                        required
                        value={workshopDraft.themeName}
                        onChange={(e) =>
                          setWorkshopDraft((prev) => ({
                            ...prev,
                            themeName: e.target.value,
                          }))
                        }
                        className="w-full min-h-[44px] px-3 py-2 rounded-[4px] border border-[#55734a]/40 bg-[#faf9f5]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="ws-seats"
                        className="block text-sm font-bold text-[#2d3f27]"
                      >
                        الأماكن المتبقية (Seats)
                      </label>
                      <input
                        id="ws-seats"
                        type="number"
                        min={0}
                        max={200}
                        required
                        dir="ltr"
                        value={workshopDraft.seatsLeft}
                        onChange={(e) =>
                          setWorkshopDraft((prev) => ({
                            ...prev,
                            seatsLeft: Number(e.target.value),
                          }))
                        }
                        className="w-full min-h-[44px] px-3 py-2 rounded-[4px] border border-[#55734a]/40 bg-[#faf9f5] text-left tabular-nums"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="ws-description"
                      className="block text-sm font-bold text-[#2d3f27]"
                    >
                      وصف الورشة
                    </label>
                    <textarea
                      id="ws-description"
                      rows={3}
                      required
                      value={workshopDraft.description}
                      onChange={(e) =>
                        setWorkshopDraft((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-[4px] border border-[#55734a]/40 bg-[#faf9f5]"
                    />
                  </div>

                  {/* Workshop Venue + Google Maps Link */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="ws-location-name"
                        className="flex items-center gap-1.5 text-sm font-bold text-[#2d3f27]"
                      >
                        <MapPin className="w-4 h-4 text-[#55734a]" aria-hidden="true" />
                        <span>مكان الورشة</span>
                      </label>
                      <input
                        id="ws-location-name"
                        type="text"
                        data-testid="admin-ws-location-name"
                        placeholder="مثلاً: مقهى كينو — وسط مدينة عنابة"
                        value={workshopDraft.locationName ?? ''}
                        onChange={(e) =>
                          setWorkshopDraft((prev) => ({
                            ...prev,
                            locationName: e.target.value,
                          }))
                        }
                        className="w-full min-h-[44px] px-3 py-2 rounded-[4px] border border-[#55734a]/40 bg-[#faf9f5]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="ws-location-maps-url"
                        className="block text-sm font-bold text-[#2d3f27]"
                      >
                        رابط الموقع في قوقل ماب (Google Maps)
                      </label>
                      <input
                        id="ws-location-maps-url"
                        type="url"
                        dir="ltr"
                        data-testid="admin-ws-location-maps-url"
                        placeholder="https://maps.app.goo.gl/..."
                        value={workshopDraft.locationMapsUrl ?? ''}
                        onChange={(e) =>
                          setWorkshopDraft((prev) => ({
                            ...prev,
                            locationMapsUrl: e.target.value,
                          }))
                        }
                        className="w-full min-h-[44px] px-3 py-2 rounded-[4px] border border-[#55734a]/40 bg-[#faf9f5] text-left text-sm"
                      />
                      {workshopDraft.locationMapsUrl?.trim().startsWith('http') && (
                        <a
                          href={workshopDraft.locationMapsUrl.trim()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#55734a] underline underline-offset-2 hover:text-[#2d3f27]"
                        >
                          <span>معاينة الرابط في قوقل ماب</span>
                          <ExternalLink className="w-3 h-3" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Image URL or Upload */}
                  <div className="space-y-2">
                    <label
                      htmlFor="ws-image-src"
                      className="block text-sm font-bold text-[#2d3f27]"
                    >
                      صورة الورشة (رابط أو رفع من الجهاز)
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        id="ws-image-src"
                        type="text"
                        dir="ltr"
                        required
                        value={workshopDraft.imageSrc}
                        onChange={(e) =>
                          setWorkshopDraft((prev) => ({
                            ...prev,
                            imageSrc: e.target.value,
                          }))
                        }
                        className="flex-1 min-w-[200px] min-h-[44px] px-3 py-2 rounded-[4px] border border-[#55734a]/40 bg-[#faf9f5] text-left text-sm"
                      />
                      <label className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-[4px] bg-[#eef2ea] border border-[#55734a]/40 text-sm font-bold cursor-pointer hover:border-[#2d3f27]">
                        <Upload className="w-4 h-4" aria-hidden="true" />
                        <span>رفع صورة</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleWorkshopImageUpload}
                          className="sr-only"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Both Slots */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-dashed border-[#55734a]/25">
                    {workshopDraft.slots.map((slot, index) => (
                      <div
                        key={slot.id}
                        className="p-4 rounded-[4px] border border-dashed border-[#55734a]/35 bg-[#faf9f5] space-y-3"
                      >
                        <p className="text-sm font-bold text-[#2d3f27]">
                          الموعد {index === 0 ? 'الأول' : 'الثاني'}
                        </p>
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-xs text-[#55734a] mb-1">
                              اليوم
                            </label>
                            <input
                              type="text"
                              required
                              value={slot.weekday}
                              onChange={(e) => {
                                const val = e.target.value;
                                setWorkshopDraft((prev) => {
                                  const nextSlots: [
                                    typeof prev.slots[0],
                                    typeof prev.slots[1]
                                  ] = [{ ...prev.slots[0] }, { ...prev.slots[1] }];
                                  nextSlots[index].weekday = val;
                                  return { ...prev, slots: nextSlots };
                                });
                              }}
                              className="w-full min-h-[44px] px-2.5 py-1.5 rounded-[4px] border border-[#55734a]/35 bg-[#fffdf9] text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-[#55734a] mb-1">
                              رقم اليوم
                            </label>
                            <input
                              type="text"
                              required
                              dir="ltr"
                              value={slot.dayNumber}
                              onChange={(e) => {
                                const val = e.target.value;
                                setWorkshopDraft((prev) => {
                                  const nextSlots: [
                                    typeof prev.slots[0],
                                    typeof prev.slots[1]
                                  ] = [{ ...prev.slots[0] }, { ...prev.slots[1] }];
                                  nextSlots[index].dayNumber = val;
                                  return { ...prev, slots: nextSlots };
                                });
                              }}
                              className="w-full min-h-[44px] px-2.5 py-1.5 rounded-[4px] border border-[#55734a]/35 bg-[#fffdf9] text-sm text-left tabular-nums"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-[#55734a] mb-1">
                              الشهر
                            </label>
                            <input
                              type="text"
                              required
                              value={slot.month}
                              onChange={(e) => {
                                const val = e.target.value;
                                setWorkshopDraft((prev) => {
                                  const nextSlots: [
                                    typeof prev.slots[0],
                                    typeof prev.slots[1]
                                  ] = [{ ...prev.slots[0] }, { ...prev.slots[1] }];
                                  nextSlots[index].month = val;
                                  return { ...prev, slots: nextSlots };
                                });
                              }}
                              className="w-full min-h-[44px] px-2.5 py-1.5 rounded-[4px] border border-[#55734a]/35 bg-[#fffdf9] text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-[#55734a] mb-1">
                              الساعة
                            </label>
                            <input
                              type="text"
                              required
                              value={slot.time}
                              onChange={(e) => {
                                const val = e.target.value;
                                setWorkshopDraft((prev) => {
                                  const nextSlots: [
                                    typeof prev.slots[0],
                                    typeof prev.slots[1]
                                  ] = [{ ...prev.slots[0] }, { ...prev.slots[1] }];
                                  nextSlots[index].time = val;
                                  return { ...prev, slots: nextSlots };
                                });
                              }}
                              className="w-full min-h-[44px] px-2.5 py-1.5 rounded-[4px] border border-[#55734a]/35 bg-[#fffdf9] text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {workshopError && (
                    <p role="alert" className="text-sm font-semibold text-[#b8322a]">
                      {workshopError}
                    </p>
                  )}
                  {workshopStatus && (
                    <p
                      role="status"
                      className="text-sm font-semibold text-[#2d3f27] bg-[#eef2ea] border border-[#55734a]/40 rounded-[4px] px-3.5 py-2.5"
                    >
                      {workshopStatus}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSavingWorkshop}
                    data-testid="admin-save-workshop-btn"
                    className="min-h-[46px] px-6 py-2.5 rounded-[4px] bg-[#2d3f27] text-[#faf9f5] font-bold text-base hover:bg-[#3a4f32] disabled:opacity-60 cursor-pointer"
                  >
                    {isSavingWorkshop
                      ? 'جاري الحفظ...'
                      : 'حفظ إعدادات الورشة'}
                  </button>
                </form>
              )}

              {/* TAB 3: REVIEWS MODERATION */}
              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  {/* Quick Add Review Form */}
                  <form
                    onSubmit={handleAddReview}
                    className="rounded-[6px] border border-dashed border-[#55734a]/40 bg-[#fffdf9] p-5 space-y-4"
                  >
                    <p className="text-base font-bold text-[#2d3f27]">
                      إضافة تقييم جديد
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="اسم المشاركة"
                        value={newReviewName}
                        onChange={(e) => setNewReviewName(e.target.value)}
                        className="min-h-[44px] px-3 py-2 rounded-[4px] border border-[#55734a]/35 bg-[#faf9f5]"
                      />
                      <input
                        type="text"
                        dir="ltr"
                        placeholder="رابط الصورة (اختياري)"
                        value={newReviewPhoto}
                        onChange={(e) => setNewReviewPhoto(e.target.value)}
                        className="min-h-[44px] px-3 py-2 rounded-[4px] border border-[#55734a]/35 bg-[#faf9f5] text-left"
                      />
                    </div>
                    <textarea
                      rows={2}
                      placeholder="رأي المشاركة في الورشة..."
                      value={newReviewText}
                      onChange={(e) => setNewReviewText(e.target.value)}
                      className="w-full px-3 py-2 rounded-[4px] border border-[#55734a]/35 bg-[#faf9f5]"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <label className="inline-flex items-center gap-2 text-sm text-[#2d3f27] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newReviewApproved}
                          onChange={(e) => setNewReviewApproved(e.target.checked)}
                        />
                        <span>معتمد للنشر فوراً</span>
                      </label>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-[4px] bg-[#2d3f27] text-[#faf9f5] text-sm font-bold cursor-pointer"
                      >
                        <Plus className="w-4 h-4" aria-hidden="true" />
                        <span>إضافة التقييم</span>
                      </button>
                    </div>
                    {reviewFormError && (
                      <p role="alert" className="text-sm text-[#b8322a]">
                        {reviewFormError}
                      </p>
                    )}
                  </form>

                  {/* Reviews List */}
                  <div className="space-y-3">
                    {reviews.length === 0 ? (
                      <p className="py-10 text-center text-[#55734a] rounded-[4px] border border-dashed border-[#55734a]/35 bg-[#fffdf9]">
                        لا توجد تقييمات في قاعدة البيانات حالياً.
                      </p>
                    ) : (
                      reviews.map((review) => (
                        <div
                          key={review.id}
                          className="rounded-[4px] border border-[#d6cebc] bg-[#fffdf9] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-start gap-3.5 min-w-0">
                            {review.photo && (
                              <button
                                type="button"
                                onClick={() => setPreviewModalUrl(review.photo)}
                                aria-label={`معاينة صورة ${review.name}`}
                                className="shrink-0 cursor-pointer rounded-[4px] overflow-hidden border border-[#55734a]/30 hover:border-[#2d3f27]"
                              >
                                <img
                                  src={review.photo}
                                  alt={`صورة ${review.name}`}
                                  referrerPolicy="no-referrer"
                                  loading="lazy"
                                  decoding="async"
                                  className="w-16 h-16 object-cover block"
                                />
                              </button>
                            )}
                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 text-sm">
                                <strong className="text-[#2d3f27]">
                                  {review.name}
                                </strong>
                                <span aria-hidden="true">·</span>
                                <span
                                  className={
                                    review.approved
                                      ? 'text-[#3a4f32] font-semibold'
                                      : 'text-[#c2692a] font-semibold'
                                  }
                                >
                                  {review.approved ? 'معتمد' : 'بانتظار الموافقة'}
                                </span>
                              </div>
                              <p className="text-base text-[#3a4f32]">
                                {review.text}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                void setReviewApproved(review.id, !review.approved)
                              }
                              className={`inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-[4px] text-sm font-bold border cursor-pointer ${
                                review.approved
                                  ? 'border-[#55734a]/40 bg-[#faf9f5] text-[#2d3f27]'
                                  : 'border-[#2d3f27] bg-[#2d3f27] text-[#faf9f5]'
                              }`}
                            >
                              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                              <span>
                                {review.approved ? 'إلغاء الموافقة' : 'موافقة'}
                              </span>
                            </button>

                            <button
                              type="button"
                              aria-label={`حذف تقييم ${review.name}`}
                              onClick={() => void deleteReview(review.id)}
                              className="inline-flex items-center justify-center w-11 h-11 rounded-[4px] border border-[#b8322a]/35 text-[#b8322a] hover:bg-[#b8322a]/10 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: TEAM ADMINS */}
              {activeTab === 'team' && (
                <div className="space-y-6" data-testid="admin-team-panel">
                  <div className="rounded-[6px] border border-dashed border-[#55734a]/45 bg-[#eef2ea]/75 p-4 sm:p-5 flex items-start gap-3">
                    <Users
                      className="w-5 h-5 text-[#3a4f32] shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <div className="space-y-1 text-sm sm:text-base text-[#2d3f27]">
                      <p className="font-bold">إدارة صلاحيات فريق Kino</p>
                      <p className="text-sm text-[#3a4f32]">
                        أضيفي إيميل Google (Gmail) لأي شريكة أو منسّقة لتتمكّن
                        من تسجيل الدخول إلى لوحة الإدارة بنفس الصلاحيات. يبقى
                        حساب المشرفة الرئيسية ثابتاً ولا يمكن حذفه.
                      </p>
                    </div>
                  </div>

                  {/* Add Admin Form */}
                  <form
                    noValidate
                    onSubmit={handleAddAdminMember}
                    data-testid="admin-add-team-form"
                    className="rounded-[6px] border border-dashed border-[#55734a]/40 bg-[#fffdf9] p-5 space-y-4"
                  >
                    <p className="text-base font-bold text-[#2d3f27]">
                      إضافة أدمين جديدة
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label
                          htmlFor="admin-add-email"
                          className="block text-xs sm:text-sm font-semibold text-[#3a4f32]"
                        >
                          إيميل Google (Gmail){' '}
                          <span className="text-[#b8322a]">*</span>
                        </label>
                        <input
                          id="admin-add-email"
                          type="email"
                          dir="ltr"
                          data-testid="admin-add-email-input"
                          placeholder="partner@gmail.com"
                          value={newAdminEmail}
                          onChange={(e) => {
                            setNewAdminEmail(e.target.value);
                            setTeamError(null);
                          }}
                          className="w-full min-h-[44px] px-3 py-2 rounded-[4px] border border-[#55734a]/35 bg-[#faf9f5] text-left text-sm sm:text-base"
                        />
                      </div>

                      <div className="space-y-1">
                        <label
                          htmlFor="admin-add-name"
                          className="block text-xs sm:text-sm font-semibold text-[#3a4f32]"
                        >
                          الاسم أو الدور (اختياري)
                        </label>
                        <input
                          id="admin-add-name"
                          type="text"
                          data-testid="admin-add-name-input"
                          placeholder="مثلاً: سارة — منسقة الورشة"
                          value={newAdminName}
                          onChange={(e) => setNewAdminName(e.target.value)}
                          className="w-full min-h-[44px] px-3 py-2 rounded-[4px] border border-[#55734a]/35 bg-[#faf9f5] text-sm sm:text-base"
                        />
                      </div>
                    </div>

                    {teamError && (
                      <p
                        role="alert"
                        className="text-sm font-semibold text-[#b8322a]"
                      >
                        {teamError}
                      </p>
                    )}

                    {teamStatus && (
                      <p
                        role="status"
                        className="text-sm font-semibold text-[#2d3f27] bg-[#eef2ea] border border-[#55734a]/40 rounded-[4px] px-3.5 py-2.5"
                      >
                        {teamStatus}
                      </p>
                    )}

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isAddingAdmin}
                        data-testid="admin-add-submit-btn"
                        className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2 rounded-[4px] bg-[#2d3f27] text-[#faf9f5] text-sm sm:text-base font-bold hover:bg-[#3a4f32] disabled:opacity-60 cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>
                          {isAddingAdmin ? 'جاري الإضافة...' : 'إضافة للوحة الإدارة'}
                        </span>
                      </button>
                    </div>
                  </form>

                  {/* Team Admins List */}
                  <div className="space-y-3">
                    {ADMIN_EMAILS.map((ownerEmail) => (
                      <div
                        key={ownerEmail}
                        data-testid={`admin-owner-row-${ownerEmail}`}
                        className="rounded-[4px] border border-[#55734a]/45 bg-[#fffdf9] p-4 flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="inline-flex items-center justify-center w-10 h-10 rounded-[4px] bg-[#2d3f27] text-[#faf9f5] shrink-0">
                            <ShieldCheck className="w-5 h-5" aria-hidden="true" />
                          </span>
                          <div className="min-w-0 space-y-0.5">
                            <p
                              className="text-sm sm:text-base font-bold text-[#2d3f27] truncate"
                              dir="ltr"
                            >
                              {ownerEmail}
                            </p>
                            <p className="text-xs text-[#55734a]">
                              حساب التأسيس الأساسي
                            </p>
                          </div>
                        </div>

                        <span className="text-xs font-bold px-2.5 py-1 rounded-[3px] border border-dashed border-[#55734a]/45 bg-[#eef2ea] text-[#2d3f27]">
                          المشرفة الرئيسية · ثابتة
                        </span>
                      </div>
                    ))}

                    {adminMembers.length === 0 ? (
                      <p className="py-8 text-center text-sm sm:text-base text-[#55734a] rounded-[4px] border border-dashed border-[#55734a]/35 bg-[#fffdf9]">
                        لا توجد مشرفات مضافات حالياً. أضيفي أول بريد Google من
                        النموذج أعلاه.
                      </p>
                    ) : (
                      adminMembers.map((member) => {
                        const isSelf =
                          normalizeAdminEmail(user?.email) === member.email;
                        return (
                          <div
                            key={member.email}
                            data-testid={`admin-member-row-${member.email}`}
                            className="rounded-[4px] border border-[#d6cebc] bg-[#fffdf9] p-4 flex flex-wrap items-center justify-between gap-3"
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p
                                  className="text-sm sm:text-base font-bold text-[#2d3f27] truncate"
                                  dir="ltr"
                                >
                                  {member.email}
                                </p>
                                {member.name && (
                                  <span className="text-xs font-semibold px-2 py-0.5 rounded-[3px] bg-[#faf9f5] border border-[#55734a]/30 text-[#3a4f32]">
                                    {member.name}
                                  </span>
                                )}
                                {isSelf && (
                                  <span className="text-xs font-semibold px-2 py-0.5 rounded-[3px] bg-[#eef2ea] text-[#2d3f27]">
                                    حسابك الحالي
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#55734a]">
                                أُضيفت بواسطة{' '}
                                <span dir="ltr">{member.addedBy || '—'}</span> ·{' '}
                                {member.createdAtText}
                              </p>
                            </div>

                            <button
                              type="button"
                              disabled={isSelf}
                              aria-label={`حذف صلاحية ${member.email}`}
                              onClick={() =>
                                void handleRemoveAdminMember(member.email)
                              }
                              className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-[4px] border border-[#b8322a]/35 text-xs sm:text-sm font-bold text-[#b8322a] hover:bg-[#b8322a]/10 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                              <span>حذف الصلاحية</span>
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Image Preview Dialog */}
      {previewModalUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="معاينة الصورة"
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
          onClick={() => setPreviewModalUrl(null)}
        >
          <div
            className="bg-[#faf9f5] p-3 rounded-[6px] border-4 border-[#6b4e31] max-w-lg w-full space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewModalUrl}
              alt="معاينة لوحة المشاركة"
              className="w-full max-h-[70vh] object-contain rounded-[3px]"
            />
            <button
              type="button"
              onClick={() => setPreviewModalUrl(null)}
              className="w-full min-h-[44px] rounded-[4px] bg-[#2d3f27] text-[#faf9f5] font-bold cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface SiteAssetAdminCardProps {
  meta: SiteAssetSlotMeta;
  record: SiteAssetRecord;
  onZoom: (url: string) => void;
  onSave: (nextSrc: string, nextAlt: string) => Promise<void>;
  onReset: () => Promise<void>;
  onError: (msg: string) => void;
}

const SiteAssetAdminCard: React.FC<SiteAssetAdminCardProps> = ({
  meta,
  record,
  onZoom,
  onSave,
  onReset,
  onError,
}) => {
  const [srcInput, setSrcInput] = useState(record.src);
  const [altInput, setAltInput] = useState(record.alt);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSrcInput(record.src);
    setAltInput(record.alt);
  }, [record.src, record.alt]);

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onError('من فضلك اختاري ملف صورة صحيح.');
      return;
    }
    setSaving(true);
    try {
      const compressed = await compressImageFileToDataUrl(file);
      setSrcInput(compressed);
      await onSave(compressed, altInput);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'تعذّر رفع الصورة.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveManual = async () => {
    if (!srcInput.trim()) {
      onError('رابط الصورة لا يمكن أن يكون فارغاً.');
      return;
    }
    setSaving(true);
    try {
      await onSave(srcInput, altInput);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'تعذّر حفظ الصورة.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      data-testid={`site-asset-card-${meta.key}`}
      className="rounded-[6px] border border-[#d6cebc] bg-[#fffdf9] p-4 space-y-3"
    >
      <div className="flex items-start gap-3.5">
        <button
          type="button"
          onClick={() => onZoom(record.src)}
          aria-label={`معاينة ${meta.label}`}
          className="w-20 h-20 shrink-0 rounded-[4px] overflow-hidden border border-[#6b4e31]/50 bg-[#eef2ea] cursor-pointer"
        >
          <img
            src={record.src}
            alt={record.alt || meta.label}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover block"
          />
        </button>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-[#2d3f27]">{meta.label}</h3>
            <span
              className={`text-xs px-2 py-0.5 rounded-[3px] border border-dashed ${
                record.isCustom
                  ? 'bg-[#f5e1d2]/60 text-[#8a4515] border-[#c2692a]/40 font-semibold'
                  : 'bg-[#eef2ea] text-[#3a4f32] border-[#55734a]/35'
              }`}
            >
              {record.isCustom ? 'مخصّصة' : 'الأصلية'}
            </span>
          </div>
          <p className="text-xs text-[#55734a]">{meta.sectionHint}</p>
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-dashed border-[#55734a]/20">
        <input
          type="text"
          dir="ltr"
          aria-label={`رابط ${meta.label}`}
          value={srcInput}
          onChange={(e) => setSrcInput(e.target.value)}
          placeholder="رابط الصورة أو المسار..."
          className="w-full min-h-[44px] px-3 py-1.5 rounded-[4px] border border-[#55734a]/35 bg-[#faf9f5] text-left text-xs sm:text-sm"
        />

        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-[4px] bg-[#2d3f27] text-[#faf9f5] text-xs sm:text-sm font-bold cursor-pointer hover:bg-[#3a4f32]">
            <Upload className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{saving ? 'جاري الرفع...' : 'تغيير من الجهاز'}</span>
            <input
              type="file"
              accept="image/*"
              disabled={saving}
              onChange={handleUploadFile}
              className="sr-only"
            />
          </label>

          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSaveManual()}
            className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-[4px] border border-[#55734a]/45 bg-[#eef2ea] text-xs sm:text-sm font-bold text-[#2d3f27] hover:border-[#2d3f27] disabled:opacity-55 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>حفظ الرابط</span>
          </button>

          {record.isCustom && (
            <button
              type="button"
              disabled={saving}
              onClick={() => void onReset()}
              className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-[4px] border border-[#b8322a]/35 text-xs sm:text-sm font-semibold text-[#b8322a] hover:bg-[#b8322a]/10 disabled:opacity-55 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>استرجاع الأصلية</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
