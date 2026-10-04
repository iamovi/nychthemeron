import { useState, useEffect, useCallback, useRef } from "react";
import { fetchGifsPage, KlipyGif } from "@/lib/klipy";
import { Search, X, Sparkles, AlertCircle, Loader2 } from "lucide-react";

interface GifPickerProps {
  onSelectGif: (gifUrl: string) => void;
  onClose: () => void;
}

export function GifPicker({ onSelectGif, onClose }: GifPickerProps) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<KlipyGif[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasApiKey = !!import.meta.env.VITE_KLIPY_API_KEY;

  const loadGifs = useCallback(
    async (searchQuery: string, pageNum: number, append = false) => {
      if (!hasApiKey) {
        setLoadingInitial(false);
        setLoadingMore(false);
        return;
      }

      if (pageNum === 1) {
        setLoadingInitial(true);
        setErrorMsg(null);
      } else {
        setLoadingMore(true);
      }

      try {
        const { gifs: newGifs, hasNext: newHasNext } = await fetchGifsPage(
          searchQuery,
          24,
          pageNum
        );

        setHasNext(newHasNext);
        setPage(pageNum);

        if (append) {
          setGifs((prevGifs) => {
            const existingIds = new Set(prevGifs.map((g) => g.id));
            const filteredNew = newGifs.filter((g) => !existingIds.has(g.id));
            return [...prevGifs, ...filteredNew];
          });
        } else {
          setGifs(newGifs);
          if (newGifs.length === 0 && searchQuery.trim()) {
            setErrorMsg("No GIFs found for this search.");
          }
        }
      } catch (err) {
        console.error("GIF loading error:", err);
        if (pageNum === 1) {
          setErrorMsg("Failed to load GIFs. Please try again.");
        }
      } finally {
        setLoadingInitial(false);
        setLoadingMore(false);
      }
    },
    [hasApiKey]
  );

  useEffect(() => {
    loadGifs("", 1, false);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [loadGifs]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setPage(1);
      loadGifs(val, 1, false);
    }, 300);
  };

  const handleClearSearch = () => {
    setQuery("");
    setPage(1);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    loadGifs("", 1, false);
  };

  useEffect(() => {
    if (!sentinelRef.current || !hasApiKey) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (
          first.isIntersecting &&
          hasNext &&
          !loadingInitial &&
          !loadingMore
        ) {
          loadGifs(query, page + 1, true);
        }
      },
      {
        root: containerRef.current,
        threshold: 0.1,
      }
    );

    const target = sentinelRef.current;
    observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
      observer.disconnect();
    };
  }, [hasNext, loadingInitial, loadingMore, page, query, loadGifs, hasApiKey]);

  return (
    <div className="flex flex-col h-[320px] sm:h-[360px] w-full max-w-sm sm:w-[350px] bg-card border-2 border-border rounded-[3px] shadow-[4px_4px_0_theme(colors.border)] overflow-hidden mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b-2 border-border bg-secondary/30">
        <div className="flex items-center gap-2 text-xs font-black text-foreground">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span>GIF Search</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="h-6 w-6 border-2 border-border rounded-[3px] bg-background hover:bg-secondary flex items-center justify-center transition-colors font-bold"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-2.5 border-b-2 border-border bg-background">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search GIFs on Klipy..."
            value={query}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-8 h-9 text-xs bg-secondary/40 border-2 border-border rounded-[3px] outline-none focus:border-primary font-medium transition-colors"
          />
          {query && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2.5 top-2.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-2 scrollbar-thin"
      >
        {!hasApiKey ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4 gap-2">
            <AlertCircle className="h-8 w-8 text-amber-500" />
            <p className="text-xs font-black text-foreground">
              Klipy API Key Missing
            </p>
            <p className="text-[11px] text-muted-foreground leading-tight max-w-[240px]">
              Add{" "}
              <code className="bg-secondary px-1 py-0.5 border border-border rounded text-[10px] font-mono">
                VITE_KLIPY_API_KEY
              </code>{" "}
              to your{" "}
              <code className="bg-secondary px-1 py-0.5 border border-border rounded text-[10px] font-mono">
                .env
              </code>{" "}
              file.
            </p>
          </div>
        ) : loadingInitial ? (
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-[3px] bg-secondary/60 animate-pulse border-2 border-border"
              />
            ))}
          </div>
        ) : errorMsg ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4 text-muted-foreground font-bold">
            <p className="text-xs">{errorMsg}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              {gifs.map((gif) => (
                <button
                  key={gif.id}
                  type="button"
                  onClick={() => onSelectGif(gif.url)}
                  className="group relative h-28 rounded-[3px] overflow-hidden border-2 border-border bg-secondary/30 hover:border-primary hover:shadow-[2px_2px_0_theme(colors.border)] transition-all focus:outline-none"
                >
                  <img
                    src={gif.previewUrl}
                    alt={gif.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                    <span className="text-[9px] text-white font-black truncate max-w-full drop-shadow">
                      {gif.title}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Sentinel for infinite scroll */}
            <div ref={sentinelRef} className="h-4 w-full flex items-center justify-center my-1">
              {loadingMore && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {!hasNext && gifs.length > 0 && (
              <p className="text-[11px] text-center text-muted-foreground font-bold py-1">
                No more GIFs
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
