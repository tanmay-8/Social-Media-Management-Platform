import { useAppStore } from '../store';

export const HomePage = () => {
  const photos = useAppStore((s) => s.generatedPhotos);

  return (
    <div className="home-container">
      <div className="page-header">
        <div>
          <div className="page-title">Your generated posts</div>
          <p className="subtle">
            All AI-generated images for your campaigns appear here.
          </p>
        </div>
      </div>

      <div className="centered-form">
        <section className="card gallery-card">
          <div className="gallery-header">
            <h3 className="gallery-title">Gallery</h3>
            {photos.length > 0 && (
              <span className="photo-count">{photos.length} {photos.length === 1 ? 'photo' : 'photos'}</span>
            )}
          </div>
          {photos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📸</div>
              <h4 className="empty-title">No photos yet</h4>
              <p className="empty-description">
                Your generated festival posts will appear here once they're created.
              </p>
            </div>
          ) : (
            <div className="gallery-grid">
              {photos.map((url) => (
                <div className="gallery-item" key={url}>
                  <img src={url} alt="Generated festival" />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};



