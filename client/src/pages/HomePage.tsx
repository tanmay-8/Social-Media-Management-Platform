import { useAppStore } from '../store';
import { ImageIcon, Plus } from 'lucide-react';

export const HomePage = () => {
  const photos = useAppStore((s) => s.generatedPhotos);

  return (
    <div className="flex min-h-[calc(100vh-120px)] flex-col">
      <div className="mb-10 animate-in fade-in slide-in-from-top duration-500">
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-[#003049] md:text-4xl">
          Your Generated Posts
        </h1>
        <p className="text-base leading-relaxed text-[#669bbc]">
          All AI-generated festival images for your campaigns appear here, ready to share.
        </p>
      </div>

      <div className="flex w-full flex-1 justify-center animate-in fade-in slide-in-from-bottom duration-700">
        <section className="w-full max-w-[1200px] rounded-3xl border border-white/40 bg-white/90 p-8 shadow-elegant backdrop-blur-sm md:p-10">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#669bbc] to-[#003049] text-white shadow-md">
                <ImageIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="m-0 text-2xl font-bold text-[#003049]">Gallery</h3>
                <p className="m-0 text-sm text-gray-500">Your creative collection</p>
              </div>
            </div>
            {photos.length > 0 && (
              <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#669bbc]/10 to-[#003049]/10 px-4 py-2 text-sm font-semibold text-[#003049]">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z"/>
                  <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd"/>
                </svg>
                {photos.length} {photos.length === 1 ? 'Image' : 'Images'}
              </div>
            )}
          </div>
          
          {photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
              <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 shadow-inner">
                <ImageIcon className="h-16 w-16 text-gray-300" />
              </div>
              <h4 className="mb-3 text-2xl font-bold text-[#003049]">No Images Yet</h4>
              <p className="m-0 max-w-md text-base leading-relaxed text-gray-500">
                Your AI-generated festival posts will appear here once they're created. Start creating stunning content for your audience!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {photos.map((url, index) => (
                <div 
                  className="group relative aspect-square cursor-pointer overflow-hidden rounded-2xl border-2 border-transparent bg-gradient-to-br from-gray-50 to-white shadow-md transition-all duration-300 hover:border-[#669bbc] hover:shadow-elegant-hover hover:scale-105" 
                  key={url}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <img src={url} alt={`Generated festival ${index + 1}`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <span className="text-xs font-medium text-white">Image {index + 1}</span>
                      <div className="flex gap-2">
                        <button className="rounded-lg bg-white/90 p-2 text-[#003049] transition-all hover:bg-white">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};



