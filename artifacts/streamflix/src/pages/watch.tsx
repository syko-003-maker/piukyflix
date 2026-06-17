import { useParams, useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import { useGetContent, useGetWatchProgress, useUpdateWatchProgress, useListEpisodes, getGetContentQueryKey, getGetWatchProgressQueryKey, getListEpisodesQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Maximize, Pause, Play as PlayIcon, Volume2, VolumeX } from "lucide-react";
import { Slider } from "@/components/ui/slider";

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

  const seasonId = content?.seasons?.[0]?.id || 0;
  const { data: episodes } = useListEpisodes(seasonId, {
    query: { enabled: content?.contentType === "series" && !!content?.seasons?.[0]?.id, queryKey: getListEpisodesQueryKey(seasonId) }
  });

  const updateProgress = useUpdateWatchProgress();

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const episode = episodeId ? episodes?.find(e => e.id === episodeId) : undefined;
  const videoUrl = content?.contentType === "series" ? episode?.videoUrl : content?.videoUrl;
  const title = content?.contentType === "series" ? `${content?.title} — ${episode?.title}` : content?.title;

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
      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          autoPlay
        />
      ) : (
        <div className="text-white text-xl">Vidéo non disponible</div>
      )}

      {/* Superposition des contrôles */}
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
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={toggleFullscreen}>
                <Maximize className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
