import { useParams, useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import { useGetContent, useGetWatchProgress, useUpdateWatchProgress, useGetMe, getGetContentQueryKey, getGetWatchProgressQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Maximize, Pause, Play as PlayIcon, Volume2, VolumeX, SkipForward } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { getDriveEmbedUrl } from "@/lib/video";
import { PrerollAd } from "@/components/content/preroll-ad";

export default function Watch() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const contentId = parseInt(id || "0", 10);
  
  const searchParams = new URLSearchParams(window.location.search);
  const episodeIdParam = searchParams.get("episodeId");
  const episodeId = episodeIdParam ? parseInt(episodeIdParam, 10) : undefined;

  const { data: content } = useGetContent(contentId, {
    query: { enabled: !!contentId, queryKey: getGetContentQueryKey(contentId) }
  });

  const { data: watchProgress } = useGetWatchProgress(contentId, {
    query: { enabled: !!contentId, queryKey: getGetWatchProgressQueryKey(contentId) }
  });

  const updateProgress = useUpdateWatchProgress();
  const { data: me } = useGetMe();

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [ended, setEnded] = useState(false);
  const [ad, setAd] = useState<any>(null);
  const [adChecked, setAdChecked] = useState(false);
  const [adDone, setAdDone] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Search every season's episodes (the content GET already embeds them), not just season 1.
  const episode = episodeId
    ? (content?.seasons ?? []).flatMap((s) => s.episodes ?? []).find((e) => e.id === episodeId)
    : undefined;
  const videoUrl = content?.contentType === "series" ? episode?.videoUrl : content?.videoUrl;
  const title = content?.contentType === "series" ? `${content?.title} — ${episode?.title}` : content?.title;
  const driveEmbed = getDriveEmbedUrl(videoUrl || "");

  // Next-episode chaining (series): flat ordered list across seasons.
  const allEpisodes = (content?.seasons ?? []).flatMap((s) => s.episodes ?? []).filter((e: any) => e.videoUrl && e.isPublished !== false);
  const currentEpIndex = episodeId ? allEpisodes.findIndex((e) => e.id === episodeId) : -1;
  const nextEpisode = currentEpIndex >= 0 && currentEpIndex < allEpisodes.length - 1 ? allEpisodes[currentEpIndex + 1] : undefined;
  const goToNext = () => { if (nextEpisode) setLocation(`/watch/${contentId}?episodeId=${nextEpisode.id}`); };
  const posterSrc = (content?.contentType === "series"
    ? (episode?.thumbnailUrl || content?.backdropUrl || content?.posterUrl)
    : (content?.backdropUrl || content?.posterUrl)) || undefined;

  // Pre-roll ad for non-VIP / non-staff users (checked once on mount).
  useEffect(() => {
    let active = true;
    fetch("/api/ads/active")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (active) { setAd(d); setAdChecked(true); } })
      .catch(() => { if (active) setAdChecked(true); });
    return () => { active = false; };
  }, []);
  const isVipOrStaff = !!me && (me.isVip || me.role === "admin" || me.role === "moderator");
  const showAd = adChecked && !!ad && !isVipOrStaff && !adDone;

  useEffect(() => {
    if (videoRef.current && watchProgress && watchProgress.progressSeconds > 0) {
      videoRef.current.currentTime = watchProgress.progressSeconds;
    }
  }, [watchProgress]);

  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (isPlaying && videoRef.current) {
        updateProgress.mutate({
          contentId,
          data: {
            progressSeconds: Math.floor(videoRef.current.currentTime),
            episodeId: episodeId,
            completed: videoRef.current.currentTime >= videoRef.current.duration * 0.95
          }
        });
      }
    }, 10000);

    return () => clearInterval(saveInterval);
  }, [isPlaying, contentId, episodeId, updateProgress]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.volume = value[0];
      setVolume(value[0]);
      setIsMuted(value[0] === 0);
    }
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const formatTime = (timeInSeconds: number) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!content) return <div className="min-h-screen bg-black" />;

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen bg-black overflow-hidden flex items-center justify-center group"
      onMouseMove={handleMouseMove}
      onClick={() => showControls ? togglePlay() : handleMouseMove()}
    >
      {showAd ? (
        <PrerollAd ad={ad} onComplete={() => setAdDone(true)} />
      ) : !adChecked ? (
        <div className="text-white text-xl">Chargement…</div>
      ) : (
      <>
      {driveEmbed ? (
        <iframe
          src={driveEmbed}
          className="absolute inset-0 h-full w-full"
          allow="autoplay; fullscreen; encrypted-media"
          allowFullScreen
          title={title || "Lecture"}
        />
      ) : videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          poster={posterSrc}
          className="w-full h-full"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => { setIsPlaying(true); setEnded(false); }}
          onPause={() => setIsPlaying(false)}
          onEnded={() => { setIsPlaying(false); setEnded(true); }}
          autoPlay
        />
      ) : (
        <div className="text-white text-xl">Vidéo non disponible</div>
      )}

      {ended && nextEpisode && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-black/80" onClick={(e) => e.stopPropagation()}>
          <p className="text-lg text-gray-300">Épisode terminé</p>
          <Button onClick={goToNext} className="bg-primary px-8 py-6 text-lg font-bold text-white hover:bg-primary/90">
            <SkipForward className="mr-2 h-6 w-6 fill-current" /> Épisode suivant
          </Button>
        </div>
      )}

      {driveEmbed && (
        <div className="pointer-events-none absolute top-0 left-0 right-0 z-10 flex items-center gap-4 bg-gradient-to-b from-black/70 to-transparent p-6">
          <Button
            variant="ghost"
            size="icon"
            className="pointer-events-auto rounded-full text-white hover:bg-white/20"
            onClick={() => setLocation(`/content/${contentId}`)}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold text-white drop-shadow-md">{title}</h1>
        </div>
      )}

      {/* Superposition des contrôles (lecteur custom uniquement) */}
      {!driveEmbed && (
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 transition-opacity duration-300 flex flex-col justify-between ${showControls ? 'opacity-100' : 'opacity-0 cursor-none'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="p-6 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/20 rounded-full"
            onClick={() => setLocation(`/content/${contentId}`)}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold text-white drop-shadow-md">{title}</h1>
        </div>

        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/40 rounded-full p-4 backdrop-blur-sm border border-white/10">
              <PlayIcon className="h-12 w-12 text-white fill-white ml-1" />
            </div>
          </div>
        )}

        {/* Contrôles bas */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-white text-sm font-medium w-12 text-right">{formatTime(currentTime)}</span>
            <Slider 
              value={[currentTime]} 
              max={duration} 
              step={1} 
              onValueChange={handleSeek}
              className="cursor-pointer"
            />
            <span className="text-white text-sm font-medium w-12">{formatTime(duration)}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={togglePlay}>
                {isPlaying ? <Pause className="h-6 w-6 fill-current" /> : <PlayIcon className="h-6 w-6 fill-current" />}
              </Button>
              
              <div className="flex items-center gap-2 group/volume">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={toggleMute}>
                  {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
                </Button>
                <div className="w-0 overflow-hidden group-hover/volume:w-24 transition-all duration-300 ease-in-out">
                  <Slider 
                    value={[isMuted ? 0 : volume]} 
                    max={1} 
                    step={0.05} 
                    onValueChange={handleVolumeChange}
                    className="w-20"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {nextEpisode && (
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={goToNext} title="Épisode suivant">
                  <SkipForward className="h-6 w-6" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={toggleFullscreen}>
                <Maximize className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      )}
      </>
      )}
    </div>
  );
}
