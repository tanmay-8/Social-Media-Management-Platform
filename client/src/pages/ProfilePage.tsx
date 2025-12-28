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
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn ghost"
            style={{ paddingInline: '0.75rem' }}
            onClick={() => navigate('/')}
          >
            ← Back
          </button>
          <div className="page-title">Profile</div>
        </div>
        <p className="subtle">
          Tell us about you so we can personalise your social media creatives.
        </p>
      </div>

      <div className="centered-form">
        <section className="card">
          <form className="card-grid" onSubmit={handleSubmit(onSubmit)}>
            <div className="form-field">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                placeholder="Your full name"
                {...register('name', { required: 'Name is required' })}
              />
              {errors.name && (
                <p className="field-error">{errors.name.message}</p>
              )}
            </div>

            <div className="form-field">
              <label>Profile photo</label>
              <div className="party-row">
                <div className="avatar">
                  {user?.photoUrl ? (
                    <img src={user.photoUrl} alt={user.name} />
                  ) : (
                    <span>{user?.name?.charAt(0).toUpperCase() ?? 'U'}</span>
                  )}
                </div>
                <div className="stack-sm">
                  <label className="btn ghost small">
                    Upload PNG
                    <input
                      type="file"
                      accept="image/png"
                      style={{ display: 'none' }}
                      onChange={handlePhotoUpload}
                    />
                  </label>
                  <span className="small muted">
                    PNG format, white background recommended.
                  </span>
                </div>
              </div>
            </div>

            <div className="form-field">
              <label>Party</label>
              <div style={{ marginTop: '0.5rem' }}>
                <select
                  {...register('partyPredefined')}
                >
                  <option value="">Select your party</option>
                  <option value="bjp">BJP</option>
                  <option value="congress">Congress</option>
                </select>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="customPartyName">If not listed</label>
              <input
                id="customPartyName"
                placeholder="Enter party name"
                {...register('customPartyName')}
                disabled={!!partyPredefined}
              />
            </div>

            <div className="form-field">
              <label>Upload party logo</label>
              <div className="party-row">
                <div className="logo-preview">
                  {user?.party?.logoUrl ? (
                    <img src={user.party.logoUrl} alt="Party logo" />
                  ) : (
                    <span className="small muted">Logo</span>
                  )}
                </div>
                <label className="btn ghost small">
                  Upload logo
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handlePartyLogoUpload}
                  />
                </label>
              </div>
            </div>

            <div className="form-field">
              <label>Festival selection</label>
              <div className="chip-row">
                <label className="chip">
                  <input
                    type="radio"
                    value="hindu"
                    {...register('festivalPreference', { required: true })}
                    style={{ display: 'none' }}
                  />
                  Hindu
                </label>
                <label className="chip">
                  <input
                    type="radio"
                    value="muslim"
                    {...register('festivalPreference', { required: true })}
                    style={{ display: 'none' }}
                  />
                  Muslim
                </label>
                <label className="chip">
                  <input
                    type="radio"
                    value="all"
                    {...register('festivalPreference', { required: true })}
                    style={{ display: 'none' }}
                  />
                  All
                </label>
              </div>
              {errors.festivalPreference && (
                <p className="field-error">Please choose at least one.</p>
              )}
            </div>

            <button
              className="btn primary"
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


