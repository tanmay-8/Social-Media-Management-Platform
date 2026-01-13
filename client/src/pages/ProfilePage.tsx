import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { socialService } from '../services/socialService';
import {
  FestivalPreference,
  PartyInfo,
  useAppStore,
  UserProfile
} from '../store';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface ProfileFormValues {
  name: string;
  partyPredefined?: 'bjp' | 'congress' | '';
  customPartyName?: string;
  festivalPreference: FestivalPreference;
}

export const ProfilePage = () => {
  const user = useAppStore((s) => s.user);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const login = useAppStore((s) => s.login);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [facebookError, setFacebookError] = useState<string | null>(null);
  const [facebookSuccess, setFacebookSuccess] = useState<string | null>(null);
  const [instagramLoading, setInstagramLoading] = useState(false);
  const [instagramError, setInstagramError] = useState<string | null>(null);
  const [instagramSuccess, setInstagramSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [selectedPage, setSelectedPage] = useState<string>('');

  const fetchFacebookPages = async () => {
    setLoadingPages(true);
    setFacebookError(null);
    try {
      const result = await socialService.getPages();
      setPages(result.pages || []);
      if (result.pages && result.pages.length > 0) {
        console.log('✅ Fetched', result.pages.length, 'Facebook pages');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to fetch pages';
      console.error('❌ Failed to fetch pages:', error);
      setFacebookError(errorMsg);
      setPages([]);
    } finally {
      setLoadingPages(false);
    }
  };

  // Fetch latest user data on mount to get updated facebookId
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const result = await authService.getCurrentUser();
        login({
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
          facebookId: result.user.facebookId,
          photoUrl: result.user.profile?.footerImage?.url,
          instagramHandle: result.user.profile?.instagramHandle
        });
        
        // If user has Facebook connected, fetch their pages
        if (result.user.facebookId) {
          fetchFacebookPages();
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };
    
    fetchUserData();
    
    // Check for Facebook connection success/error in URL
    const fbConnected = searchParams.get('facebook_connected');
    const igConnected = searchParams.get('instagram_connected');
    const error = searchParams.get('error');
    
    if (fbConnected === 'true') {
      setFacebookSuccess('Facebook account connected successfully!');
      setTimeout(() => setFacebookSuccess(null), 5000);
      // Remove the query parameter
      searchParams.delete('facebook_connected');
      setSearchParams(searchParams);
    }

    if (igConnected === 'true') {
      setInstagramSuccess('Instagram account connected successfully!');
      setTimeout(() => setInstagramSuccess(null), 5000);
      // Remove the query parameter
      searchParams.delete('instagram_connected');
      setSearchParams(searchParams);
    }
    
    if (error === 'facebook_already_connected') {
      setFacebookError('This Facebook account is already connected to another user');
      setTimeout(() => setFacebookError(null), 5000);
      // Remove the query parameter
      searchParams.delete('error');
      setSearchParams(searchParams);
    }

    if (error === 'instagram_already_connected') {
      setInstagramError('This Instagram account is already connected to another user');
      setTimeout(() => setInstagramError(null), 5000);
      // Remove the query parameter
      searchParams.delete('error');
      setSearchParams(searchParams);
    }
  }, [login, searchParams, setSearchParams]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<ProfileFormValues>({
    defaultValues: {
      name: user?.name ?? '',
      partyPredefined:
        user?.party?.type === 'predefined'
          ? (user.party.name.toLowerCase() as 'bjp' | 'congress')
          : '',
      customPartyName:
        user?.party?.type === 'custom' ? user.party.name : undefined,
      festivalPreference: user?.festivalPreference ?? 'all'
    }
  });

  // Watch form fields
  const partyPredefined = watch('partyPredefined');

  const onSubmit = async (data: ProfileFormValues) => {
    setSaveError(null);
    setSaveSuccess(null);

    try {
      // Call backend API to save profile
      const result = await userService.updateProfile({
        name: data.name,
        festivalCategory: data.festivalPreference
      });

      // Update local store with saved data
      const party: PartyInfo | undefined =
        data.partyPredefined
          ? {
              type: 'predefined',
              name: data.partyPredefined.toUpperCase()
            }
          : data.customPartyName
          ? {
              type: 'custom',
              name: data.customPartyName
            }
          : undefined;

      const updated: Partial<UserProfile> = {
        name: data.name,
        party,
        festivalPreference: data.festivalPreference
      };

      updateProfile(updated);
      
      setSaveSuccess('Profile saved successfully!');
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save profile';
      setSaveError(message);
      setTimeout(() => setSaveError(null), 5000);
    }
  };

  const handlePhotoUpload: React.ChangeEventHandler<HTMLInputElement> = async (
    event
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSaveError(null);
    setSaveSuccess(null);

    try {
      // Upload to backend
      const result = await userService.uploadFooter(file);
      
      // Update local store with new image URL
      updateProfile({ photoUrl: result.url });
      
      setSaveSuccess('Photo uploaded successfully!');
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload photo';
      setSaveError(message);
      setTimeout(() => setSaveError(null), 5000);
    }
  };

  const handlePartyLogoUpload: React.ChangeEventHandler<HTMLInputElement> = (
    event
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const currentParty = user?.party ?? {
      type: 'custom',
      name: ''
    };

    updateProfile({
      party: {
        ...currentParty,
        logoUrl: url
      }
    });
  };

  const handleConnectFacebook = () => {
    // Redirect to Facebook OAuth for account linking
    authService.loginWithFacebook();
  };

  const handleConnectPage = async () => {
    if (!selectedPage) {
      setFacebookError('Please select a page');
      setTimeout(() => setFacebookError(null), 3000);
      return;
    }

    setFacebookLoading(true);
    setFacebookError(null);
    setFacebookSuccess(null);

    try {
      console.log('🔵 Connecting page:', selectedPage);
      
      const result = await socialService.connectFacebook({
        pageId: selectedPage,
        pageAccessToken: '' // No longer needed - server will get it
      });

      console.log('✅ Page connected successfully');
      setFacebookSuccess('Facebook Page connected successfully!');
      setSelectedPage(''); // Reset selection
      
      // Refresh user data
      const userResult = await authService.getCurrentUser();
      login({
        id: userResult.user.id,
        name: userResult.user.name,
        email: userResult.user.email,
        role: userResult.user.role,
        facebookId: userResult.user.facebookId,
        photoUrl: userResult.user.profile?.footerImage?.url
      });

      setTimeout(() => setFacebookSuccess(null), 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect page';
      console.error('❌ Failed to connect page:', error);
      setFacebookError(message);
      setTimeout(() => setFacebookError(null), 5000);
    } finally {
      setFacebookLoading(false);
    }
  };

  const handleDisconnectFacebook = async () => {
    setFacebookLoading(true);
    setFacebookError(null);
    setFacebookSuccess(null);

    try {
      const result = await authService.disconnectFacebook();
      setFacebookSuccess('Facebook and Instagram accounts disconnected successfully');
      
      // Update user in store
      updateProfile({
        ...user,
        facebookId: undefined,
        instagramHandle: undefined
      });

      setTimeout(() => setFacebookSuccess(null), 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to disconnect accounts';
      setFacebookError(message);
      setTimeout(() => setFacebookError(null), 5000);
    } finally {
      setFacebookLoading(false);
    }
  };

  const handleConnectInstagram = () => {
    // Redirect to Instagram OAuth for account linking
    authService.loginWithInstagram();
  };

  const handleDisconnectInstagram = async () => {
    setInstagramLoading(true);
    setInstagramError(null);
    setInstagramSuccess(null);

    try {
      const result = await authService.disconnectInstagram();
      setInstagramSuccess('Instagram account disconnected successfully');
      
      // Update user in store
      updateProfile({
        ...user,
        instagramHandle: undefined
      });

      setTimeout(() => setInstagramSuccess(null), 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to disconnect Instagram';
      setInstagramError(message);
      setTimeout(() => setInstagramError(null), 5000);
    } finally {
      setInstagramLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-start">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[rgba(0,48,73,0.25)] bg-[#fdf0d5] px-3 py-2.5 text-[0.9rem] text-[#003049] transition-all duration-150 hover:border-[#669bbc] hover:bg-[#fffaf0]"
            onClick={() => navigate('/')}
          >
            ← Back
          </button>
          <div className="text-[1.3rem] font-semibold text-[#003049]">Profile</div>
        </div>
        <p className="text-[0.85rem] text-[#7f7270]">
          Tell us about you so we can personalise your social media creatives.
        </p>
      </div>

      <div className="flex w-full justify-center">
        <section className="w-full max-w-[900px] rounded-2xl border border-[rgba(0,48,73,0.18)] bg-[#fffaf0] p-6 shadow-[0_14px_40px_rgba(0,48,73,0.14)]">
          <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
            {saveError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                <XCircle className="h-4 w-4" />
                {saveError}
              </div>
            )}
            
            {saveSuccess && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700 border border-green-200">
                <CheckCircle className="h-4 w-4" />
                {saveSuccess}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-[0.85rem] text-[#003049]">Name</label>
              <input
                id="name"
                placeholder="Your full name"
                className="rounded-xl border border-[rgba(0,48,73,0.3)] bg-[#fffaf0] px-3 py-2 text-[0.9rem] text-[#003049] placeholder:text-[#c9bfb6] focus:border-[#669bbc] focus:outline-none focus:ring-2 focus:ring-[#669bbc]/20"
                {...register('name', { required: 'Name is required' })}
              />
              {errors.name && (
                <p className="m-0 text-xs text-[#c1121f]">{errors.name.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.85rem] text-[#003049]">Profile photo</label>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[radial-gradient(circle_at_30%_0,#c1121f,#780000_60%,#003049)] text-[0.9rem] text-[#fdf0d5]">
                  {user?.photoUrl ? (
                    <img src={user.photoUrl} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    <span>{user?.name?.charAt(0).toUpperCase() ?? 'U'}</span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[rgba(0,48,73,0.25)] bg-[#fdf0d5] px-3 py-1.5 text-[0.85rem] text-[#003049] transition-all duration-150 hover:border-[#669bbc] hover:bg-[#fffaf0]">
                    Upload PNG
                    <input
                      type="file"
                      accept="image/png"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </label>
                  <span className="text-xs text-[#7f7270]">
                    PNG format, white background recommended.
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.85rem] text-[#003049]">Party</label>
              <div className="mt-2">
                <select
                  className="w-full rounded-xl border border-[rgba(0,48,73,0.3)] bg-[#fffaf0] px-3 py-2 text-[0.9rem] text-[#003049] focus:border-[#669bbc] focus:outline-none focus:ring-2 focus:ring-[#669bbc]/20"
                  {...register('partyPredefined')}
                >
                  <option value="">Select your party</option>
                  <option value="bjp">BJP</option>
                  <option value="congress">Congress</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="customPartyName" className="text-[0.85rem] text-[#003049]">If not listed</label>
              <input
                id="customPartyName"
                placeholder="Enter party name"
                className="rounded-xl border border-[rgba(0,48,73,0.3)] bg-[#fffaf0] px-3 py-2 text-[0.9rem] text-[#003049] placeholder:text-[#c9bfb6] disabled:opacity-50 focus:border-[#669bbc] focus:outline-none focus:ring-2 focus:ring-[#669bbc]/20"
                {...register('customPartyName')}
                disabled={!!partyPredefined}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.85rem] text-[#003049]">Upload party logo</label>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-dashed border-[rgba(0,48,73,0.4)]">
                  {user?.party?.logoUrl ? (
                    <img src={user.party.logoUrl} alt="Party logo" className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-xs text-[#7f7270]">Logo</span>
                  )}
                </div>
                <label className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[rgba(0,48,73,0.25)] bg-[#fdf0d5] px-3 py-1.5 text-[0.85rem] text-[#003049] transition-all duration-150 hover:border-[#669bbc] hover:bg-[#fffaf0]">
                  Upload logo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePartyLogoUpload}
                  />
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.85rem] text-[#003049]">Festival selection</label>
              <div className="flex gap-2">
                <label className="cursor-pointer rounded-full border border-[rgba(0,48,73,0.4)] px-3 py-1 text-[0.8rem] has-[:checked]:border-[#c1121f] has-[:checked]:bg-[rgba(193,18,31,0.08)]">
                  <input
                    type="radio"
                    value="hindu"
                    {...register('festivalPreference', { required: true })}
                    className="hidden"
                  />
                  Hindu
                </label>
                <label className="cursor-pointer rounded-full border border-[rgba(0,48,73,0.4)] px-3 py-1 text-[0.8rem] has-[:checked]:border-[#c1121f] has-[:checked]:bg-[rgba(193,18,31,0.08)]">
                  <input
                    type="radio"
                    value="muslim"
                    {...register('festivalPreference', { required: true })}
                    className="hidden"
                  />
                  Muslim
                </label>
                <label className="cursor-pointer rounded-full border border-[rgba(0,48,73,0.4)] px-3 py-1 text-[0.8rem] has-[:checked]:border-[#c1121f] has-[:checked]:bg-[rgba(193,18,31,0.08)]">
                  <input
                    type="radio"
                    value="all"
                    {...register('festivalPreference', { required: true })}
                    className="hidden"
                  />
                  All
                </label>
              </div>
              {errors.festivalPreference && (
                <p className="m-0 text-xs text-[#c1121f]">Please choose at least one.</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5 rounded-xl border-2 border-[rgba(0,48,73,0.15)] bg-white p-4">
              <label className="text-[0.9rem] font-medium text-[#003049]">Facebook & Instagram</label>
              <p className="text-[0.8rem] text-[#7f7270] mb-2">
                Connect your Facebook account to manage both Facebook and Instagram posts. If you have an Instagram Business Account linked to your Facebook Page, it will be automatically connected.
              </p>
              
              {facebookError && (
                <div className="mb-2 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                  <XCircle className="h-4 w-4" />
                  {facebookError}
                </div>
              )}
              
              {facebookSuccess && (
                <div className="mb-2 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700 border border-green-200">
                  <CheckCircle className="h-4 w-4" />
                  {facebookSuccess}
                </div>
              )}

              {user?.facebookId ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-[0.85rem] font-medium text-[#003049]">Facebook Connected</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleDisconnectFacebook}
                        disabled={facebookLoading}
                        className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[rgba(193,18,31,0.4)] bg-white px-3 py-1.5 text-[0.85rem] text-[#c1121f] transition-all duration-150 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {facebookLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Disconnecting...
                          </>
                        ) : (
                          'Disconnect Both'
                        )}
                      </button>
                    </div>
                    {user?.instagramHandle ? (
                      <div className="flex items-center gap-2 pl-7">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-[0.8rem] text-[#003049]">Instagram connected: @{user.instagramHandle}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 pl-7">
                        <XCircle className="h-4 w-4 text-amber-600" />
                        <span className="text-[0.8rem] text-[#7f7270]">No Instagram Business Account linked to your Facebook Page</span>
                      </div>
                    )}
                  </div>

                  {/* Facebook Pages Selection */}
                  <div className="border-t border-gray-200 pt-3">
                    <label className="text-[0.85rem] font-medium text-[#003049] mb-2 block">Connect Facebook Page</label>
                    <p className="text-[0.75rem] text-[#7f7270] mb-3">
                      Select a Facebook page to post your generated content
                    </p>

                    {facebookError && (
                      <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200 mb-3">
                        <XCircle className="h-4 w-4" />
                        {facebookError}
                      </div>
                    )}

                    {facebookSuccess && (
                      <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700 border border-green-200 mb-3">
                        <CheckCircle className="h-4 w-4" />
                        {facebookSuccess}
                      </div>
                    )}

                    {loadingPages ? (
                      <div className="flex items-center gap-2 text-sm text-[#669bbc]">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading pages...
                      </div>
                    ) : pages.length > 0 ? (
                      <div className="flex gap-2">
                        <select
                          value={selectedPage}
                          onChange={(e) => setSelectedPage(e.target.value)}
                          className="flex-1 rounded-lg border border-[rgba(0,48,73,0.3)] bg-white px-3 py-2 text-[0.85rem] text-[#003049] focus:border-[#669bbc] focus:outline-none focus:ring-2 focus:ring-[#669bbc]/20"
                        >
                          <option value="">Select a page</option>
                          {pages.map((page) => (
                            <option key={page.id} value={page.id}>
                              {page.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={handleConnectPage}
                          disabled={!selectedPage}
                          className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#669bbc] bg-[#669bbc] px-4 py-2 text-[0.85rem] text-white transition-all duration-150 hover:bg-[#003049] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Connect Page
                        </button>
                      </div>
                    ) : (
                      <p className="text-[0.8rem] text-[#7f7270]">
                        No pages found. Make sure you have Facebook pages associated with your account.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleConnectFacebook}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-[rgba(0,48,73,0.15)] bg-white px-4 py-2 text-[0.85rem] font-medium text-[#003049] transition-all duration-150 hover:border-[#1877F2] hover:bg-[#f8f9fa]"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Connect Facebook & Instagram
                  </button>
                  <p className="text-[0.75rem] text-[#7f7270] italic">
                    Note: Instagram will be automatically connected if you have a Business Account linked to your Facebook Page
                  </p>
                </div>
              )}
            </div>

            <button
              className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border-0 bg-gradient-to-br from-[#780000] to-[#c1121f] px-4 py-2.5 text-[0.9rem] text-[#fdf0d5] shadow-[0_14px_35px_rgba(120,0,0,0.45)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(120,0,0,0.5)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:shadow-[0_14px_35px_rgba(120,0,0,0.45)]"
              type="submit"
              disabled={isSubmitting}
            >
              Save profile
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};


