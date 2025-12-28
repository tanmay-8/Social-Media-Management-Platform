import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import {
  FestivalPreference,
  PartyInfo,
  useAppStore,
  UserProfile
} from '../store';

interface ProfileFormValues {
  name: string;
  partyPredefined?: 'bjp' | 'congress' | '';
  customPartyName?: string;
  festivalPreference: FestivalPreference;
}

export const ProfilePage = () => {
  const user = useAppStore((s) => s.user);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const navigate = useNavigate();

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

  const partyPredefined = watch('partyPredefined');

  const onSubmit = (data: ProfileFormValues) => {
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
  };

  const handlePhotoUpload: React.ChangeEventHandler<HTMLInputElement> = (
    event
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    updateProfile({ photoUrl: url });
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


