import { useNavigate, useNavigationType, Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import ComposePost from "@/components/ComposePost";
import PostCard from "@/components/PostCard";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { usePosts } from "@/hooks/usePosts";
import { FrogLoader, FullScreenFrogLoader } from "@/components/ui/FrogLoader";
import { Helmet } from "react-helmet-async";
import { PostSkeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { PageTransition } from "@/components/ui/PageTransition";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const {
    posts,
    loading: postsLoading,
    createPost,
    toggleLike,
    toggleBookmark,
    deletePost,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = usePosts();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const observerRef = useRef<HTMLDivElement>(null);
  const paginationRequestInFlightRef = useRef(false);
  const scrollRestoredRef = useRef(false);

  useEffect(() => {
    paginationRequestInFlightRef.current = isFetchingNextPage;
  }, [isFetchingNextPage]);

  // Save scroll position
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem("nychthemeron_feed_scroll", window.scrollY.toString());
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Restore scroll position
  useEffect(() => {
    let timeout1: ReturnType<typeof setTimeout>;
    let timeout2: ReturnType<typeof setTimeout>;

    if (navigationType === "POP" && !postsLoading && posts.length > 0 && !scrollRestoredRef.current) {
      const savedY = sessionStorage.getItem("nychthemeron_feed_scroll") || sessionStorage.getItem("genjutsu_feed_scroll");
      if (savedY) {
        const y = parseInt(savedY, 10);
        // Restore immediately, and then again after a short delay to account for layout shifts (e.g. images)
        window.scrollTo(0, y);
        timeout1 = setTimeout(() => window.scrollTo(0, y), 50);
        timeout2 = setTimeout(() => window.scrollTo(0, y), 200);
        scrollRestoredRef.current = true;
      }
    }

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
    };
  }, [navigationType, postsLoading, posts.length]);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        if (paginationRequestInFlightRef.current) return;

        paginationRequestInFlightRef.current = true;
        void fetchNextPage().finally(() => {
          paginationRequestInFlightRef.current = false;
        });
      },
      {
        threshold: 0,
        rootMargin: "0px 0px 600px 0px",
      }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (authLoading) {
    return <FullScreenFrogLoader />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Nychthemeron — everything vanishes.</title>
        <meta name="description" content="Share your code and thoughts on Nychthemeron. Everything disappears after 24 hours. No archives, no regrets." />
        <meta property="og:title" content="Nychthemeron — 24 Hour Social Media" />
        <meta property="og:description" content="The social network where everything is temporary. 24 hours only. Share code & connect." />
        <meta property="og:image" content="/Nychthemeron-logo.png" />
      </Helmet>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <PageTransition className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          <div className="min-w-0">
            {user ? (
              <ComposePost onPost={createPost} />
            ) : (
              <div className="gum-card p-6 md:p-8 mb-6 border-2 border-primary/20 bg-gradient-to-b from-primary/5 to-background">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-16 h-16 rounded-[4px] overflow-hidden gum-border shrink-0 bg-background p-1">
                    <img src="/Nychthemeron-logo.png" alt="Nychthemeron" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 text-center md:text-left space-y-2">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                      <h1 className="font-extrabold text-2xl md:text-3xl tracking-tight text-foreground">Nychthemeron</h1>
                      <span className="text-[11px] font-mono font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-[3px] border border-primary/20 uppercase tracking-widest">
                        24h Ephemeral Network
                      </span>
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                      Nychthemeron is an ephemeral social network built for developers, programmers, and creators where posts, code snippets, whispers, and thoughts automatically vanish after 24 hours.
                    </p>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                      <button
                        onClick={() => navigate("/auth")}
                        className="gum-btn bg-primary text-primary-foreground text-sm font-bold px-5 py-2.5 flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                      >
                        Sign In / Get Started
                      </button>
                      <button
                        onClick={() => navigate("/about")}
                        className="gum-btn bg-secondary text-secondary-foreground hover:bg-secondary/80 text-sm font-bold px-4 py-2.5"
                      >
                        Learn More
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-border/60 text-xs">
                  <div className="bg-background/80 p-3 rounded-[3px] border border-border">
                    <div className="font-bold text-foreground">⚡ 24h Purge</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">Posts delete daily</div>
                  </div>
                  <div className="bg-background/80 p-3 rounded-[3px] border border-border">
                    <div className="font-bold text-foreground">💬 Whispers</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">Ephemeral direct chat</div>
                  </div>
                  <div className="bg-background/80 p-3 rounded-[3px] border border-border">
                    <div className="font-bold text-foreground">🎮 Game House</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">HTML5 dev mini-games</div>
                  </div>
                  <div className="bg-background/80 p-3 rounded-[3px] border border-border">
                    <div className="font-bold text-foreground">🔒 Privacy First</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">Zero tracking cookies</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground pt-4 mt-4 border-t border-border/40 gap-2">
                  <span>Explore public posts below without logging in</span>
                  <div className="flex items-center gap-3 font-semibold">
                    <Link to="/about" className="hover:text-primary transition-colors">About</Link>
                    <span>•</span>
                    <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
                    <span>•</span>
                    <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
                  </div>
                </div>
              </div>
            )}

            {postsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <PostSkeleton key={i} />)}
              </div>
            ) : posts.length === 0 ? (
              <div className="gum-card p-8 text-center border-dashed border-2">
                <p className="text-muted-foreground text-sm font-medium">{t("feed.noIllusions")}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("feed.beTheFirst")}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map((post, index) => (
                  <div 
                    key={post.id} 
                    className="animate-fade-in" 
                    style={{ animationDelay: `${(index % 10) * 50}ms`, animationFillMode: "both" }}
                  >
                    <PostCard
                      post={post}
                      onLike={toggleLike}
                      onBookmark={toggleBookmark}
                      onDelete={deletePost}
                    />
                  </div>
                ))}

                {isFetchingNextPage && (
                  <div className="space-y-4" aria-hidden="true">
                    {[1, 2].map((i) => (
                      <PostSkeleton key={`next-page-skeleton-${i}`} />
                    ))}
                  </div>
                )}

                <div ref={observerRef} className="h-10 flex justify-center items-center">
                  {isFetchingNextPage && <FrogLoader className=" text-muted-foreground" size={20} />}
                </div>
              </div>
            )}
          </div>
          <div className="hidden lg:block lg:sticky lg:top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto pr-2 custom-scrollbar">
            <Sidebar />
          </div>
        </PageTransition>
      </main>
    </div>
  );
};

export default Index;
