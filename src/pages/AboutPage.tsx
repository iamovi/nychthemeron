import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Code, Zap, Shield, ArrowLeft, Ghost, Github, Paintbrush, Trash2, Gamepad2, Share2, Smartphone, MessageCircle, Clock, UsersRound, Download, Lock, Languages, Image, KeyRound, HardDrive, Library, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { GitCommitHorizontal } from "lucide-react";

const AboutPage = () => {
    const { user } = useAuth();
    const { t } = useTranslation();

    const { data: commits, isLoading: isLoadingCommits } = useQuery({
        queryKey: ['github-commits'],
        queryFn: async () => {
            const res = await fetch('https://api.github.com/repos/iamovi/nychthemeron/commits?per_page=5');
            if (!res.ok) throw new Error('Failed to fetch');
            return await res.json();
        },
        staleTime: 1000 * 60 * 30, // 30 min
        retry: false,
    });

    const features = [
        {
            icon: <Clock className="text-primary" size={20} />,
            title: t("about.feat1Title"),
            description: t("about.feat1Desc")
        },
        {
            icon: <Code className="text-primary" size={20} />,
            title: t("about.feat2Title"),
            description: t("about.feat2Desc")
        },
        {
            icon: <Paintbrush className="text-primary" size={20} />,
            title: t("about.feat3Title"),
            description: t("about.feat3Desc")
        },
        {
            icon: <Zap className="text-primary" size={20} />,
            title: t("about.feat4Title"),
            description: t("about.feat4Desc")
        },
        {
            icon: <Shield className="text-primary" size={20} />,
            title: t("about.feat5Title"),
            description: t("about.feat5Desc")
        },
        {
            icon: <Trash2 className="text-primary" size={20} />,
            title: t("about.feat6Title"),
            description: t("about.feat6Desc")
        },
        {
            icon: <Gamepad2 className="text-primary" size={20} />,
            title: t("about.feat7Title"),
            description: t("about.feat7Desc")
        },
        {
            icon: <Ghost className="text-primary" size={20} />,
            title: t("about.feat8Title"),
            description: t("about.feat8Desc")
        },
        {
            icon: <Share2 className="text-primary" size={20} />,
            title: t("about.feat9Title"),
            description: t("about.feat9Desc")
        },
        {
            icon: <Smartphone className="text-primary" size={20} />,
            title: t("about.feat10Title"),
            description: t("about.feat10Desc"),
            downloadUrl: "https://github.com/iamovi/nychthemeron/releases/download/v3.0.0/nychthemeron-v3.0.0.apk"
        },
        {
            icon: <MessageCircle className="text-primary" size={20} />,
            title: t("about.feat11Title"),
            description: t("about.feat11Desc")
        },
        {
            icon: <UsersRound className="text-primary" size={20} />,
            title: t("about.feat12Title"),
            description: t("about.feat12Desc")
        },
        {
            icon: <Library className="text-primary" size={20} />,
            title: t("about.feat13Title", "Game House"),
            description: t("about.feat13Desc", "A gallery of HTML5 mini-games built by the community. Play instantly or submit your own games.")
        },
        {
            icon: <Lock className="text-primary" size={20} />,
            title: t("about.feat14Title", "App Lock & PIN"),
            description: t("about.feat14Desc", "Protect your feed, whispers, and settings with an optional secure session PIN lock.")
        },
        {
            icon: <HardDrive className="text-primary" size={20} />,
            title: t("about.feat15Title", "Data Saver Mode"),
            description: t("about.feat15Desc", "Enable data saver to gate and load external images only on user click, saving mobile data.")
        },
        {
            icon: <Languages className="text-primary" size={20} />,
            title: t("about.feat16Title", "Multilingual Support"),
            description: t("about.feat16Desc", "Built-in localization for over 10 languages, catering to global developers and users alike.")
        },
        {
            icon: <Image className="text-primary" size={20} />,
            title: t("about.feat17Title", "Smart Compression"),
            description: t("about.feat17Desc", "Compresses avatars, banners, post media, and DM attachments client-side before uploading for fast loading.")
        },
        {
            icon: <KeyRound className="text-primary" size={20} />,
            title: t("about.feat18Title", "MFA Verification"),
            description: t("about.feat18Desc", "Protect your account session using Supabase multi-factor authentication (MFA) OTP codes.")
        },
        {
            icon: <HelpCircle className="text-primary" size={20} />,
            title: t("about.feat19Title", "Anonymous Q&A"),
            description: t("about.feat19Desc", "Receive anonymous questions from anyone via your public Q&A link and answer them directly on your public feed.")
        },
        {
            icon: <Image className="text-primary" size={20} />,
            title: t("about.feat20Title", "Profile Photo Album"),
            description: t("about.feat20Desc", "Share images of what you're working on in your profile album, automatically disappearing after 24 hours.")
        }
    ];

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Helmet>
                <title>About Nychthemeron — The Art of Illusions</title>
                <meta name="description" content="Learn about Nychthemeron, the social platform for developers where everything disappears after 24 hours." />
            </Helmet>
            <Navbar />
            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 px-3 py-1.5 gum-card bg-secondary text-xs font-bold hover:bg-primary hover:text-primary-foreground transition-colors w-fit"
                        >
                            <ArrowLeft size={14} />
                            {t("about.backToHome")}
                        </Link>

                        <div className="gum-card p-6 md:p-10">
                            <section className="mb-12">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 rounded-[4px] gum-border overflow-hidden shrink-0 rotate-3">
                                        <img src="/Nychthemeron-logo.png" alt="Nychthemeron" className="w-full h-full object-contain" />
                                    </div>
                                    <div>
                                        <h1 className="text-4xl font-bold tracking-tighter">{t("about.title")}</h1>
                                        <p className="text-primary font-mono text-sm">{t("about.subtitle")}</p>
                                    </div>
                                </div>

                                <div className="prose dark:prose-invert max-w-none text-base leading-relaxed text-foreground/90">
                                    <p className="text-lg font-medium leading-relaxed italic border-l-4 border-primary pl-4 py-2 bg-secondary/30 rounded-r-lg">
                                        {t("about.quote")}
                                    </p>
                                    <p className="mt-6">
                                        {t("about.intro1")}<strong>{t("about.introFocus")}</strong>{t("about.intro2")}
                                    </p>
                                </div>
                            </section>

                            <section className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-12">
                                {features.map((feature, index) => (
                                    <motion.div
                                        key={feature.title}
                                        initial={{ opacity: 0, x: index % 2 === 0 ? -10 : 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="space-y-1"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-primary shrink-0">{feature.icon}</span>
                                            <h3 className="font-bold text-base text-foreground">{feature.title}</h3>
                                        </div>
                                        <p className="text-sm text-foreground/70 leading-relaxed pl-7">
                                            {feature.description}
                                        </p>
                                        {'downloadUrl' in feature && (
                                            <div className="pl-7 mt-1">
                                                <a
                                                    href={feature.downloadUrl as string}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline"
                                                >
                                                    <Download size={12} />
                                                    {t("about.downloadApk")}
                                                </a>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </section>

                            <section className="bg-secondary/20 rounded-[3px] p-8 border-2 border-dashed border-border text-center">
                                <Ghost className="mx-auto text-primary/30 mb-4" size={48} />
                                <h2 className="text-2xl font-bold mb-3 tracking-tight">{t("about.section2Title")}</h2>
                                <p className="text-sm text-foreground/70 max-w-lg mx-auto leading-relaxed mb-6">
                                    {t("about.section2Desc")}
                                </p>
                                <Link
                                    to={user ? "/" : "/auth"}
                                    className="gum-btn bg-primary text-primary-foreground inline-flex items-center gap-2"
                                >
                                    {user ? t("about.castIllusion") : t("about.castFirstSpell")}
                                </Link>
                            </section>

                            {/* Support Section */}
                            <section className="mt-12 text-foreground">
                                <p className="text-xs font-mono uppercase tracking-widest text-primary/70 mb-6 border-l-2 border-primary/50 pl-3">
                                    {t("about.supportSubtitle")}
                                </p>
                                <div className="gum-card p-6 md:p-8 text-center">
                                    <h3 className="text-2xl font-bold uppercase tracking-tight mb-3">
                                        {t("about.supportTitle")}
                                    </h3>
                                    <p className="text-sm text-foreground/80 font-medium max-w-2xl mx-auto leading-relaxed mb-8">
                                        {t("about.supportDesc")}
                                    </p>
                                    <a
                                        href="https://www.supportkori.com/iamovi"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block hover:opacity-90 transition-opacity"
                                    >
                                        <img
                                            src="https://raw.githubusercontent.com/iamovi/nychthemeron/refs/heads/main/.github/tea_text.jpg"
                                            alt="Support the developer"
                                            className="w-52 mx-auto gum-border rounded-[3px]"
                                        />
                                    </a>
                                </div>
                            </section>

                            {/* Open Source & Contributors Section */}
                            <section className="mt-12 mb-4 text-foreground">
                                <p className="text-xs font-mono uppercase tracking-widest text-primary/70 mb-6 border-l-2 border-primary/50 pl-3">{t("about.osSubtitle")}</p>
                                <div className="gum-card p-6 md:p-8">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-8 border-b border-border">
                                        <div>
                                            <h3 className="text-2xl font-bold uppercase tracking-tight mb-2">{t("about.osTitle")}</h3>
                                            <p className="text-sm text-foreground/80 font-medium max-w-xl leading-relaxed">
                                                {t("about.osDesc")}
                                            </p>
                                        </div>
                                        <a href="https://github.com/iamovi/nychthemeron" target="_blank" rel="noopener noreferrer"
                                            className="gum-btn bg-primary text-primary-foreground inline-flex items-center gap-2 px-6 py-3 font-bold uppercase tracking-wide text-sm whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity">
                                            <Github size={20} />
                                            {t("about.viewGithub")}
                                        </a>
                                    </div>

                                    {/* Commits List */}
                                    <p className="text-xs font-mono uppercase tracking-widest text-primary/70 mb-4 border-l-2 border-primary/50 pl-3">// Recent Commits</p>
                                    <div className="space-y-1">
                                        {isLoadingCommits ? (
                                            Array.from({ length: 6 }).map((_, i) => (
                                                <div key={i} className="flex items-center gap-3 py-2.5 animate-pulse">
                                                    <div className="w-4 h-4 rounded bg-secondary shrink-0" />
                                                    <div className="h-3 w-2/3 rounded bg-secondary" />
                                                    <div className="h-3 w-16 rounded bg-secondary ml-auto" />
                                                </div>
                                            ))
                                        ) : commits?.length ? (
                                            commits.map((c: any) => (
                                                <a
                                                    key={c.sha}
                                                    href={c.html_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-start gap-3 py-2.5 px-2 rounded-[3px] hover:bg-secondary/50 transition-colors group border-b border-border/50 last:border-0"
                                                >
                                                    <GitCommitHorizontal size={14} className="text-primary/60 mt-0.5 shrink-0" />
                                                    <span className="text-xs font-mono text-foreground/80 group-hover:text-foreground transition-colors flex-1 leading-relaxed line-clamp-1">
                                                        {c.commit.message.split('\n')[0]}
                                                    </span>
                                                    <span className="text-[10px] font-mono text-muted-foreground shrink-0 ml-2">
                                                        {new Date(c.commit.author.date).toLocaleDateString()}
                                                    </span>
                                                </a>
                                            ))
                                        ) : (
                                            <p className="text-xs text-muted-foreground py-2">No commits found.</p>
                                        )}
                                    </div>

                                </div>
                            </section>

                            <footer className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="text-xs text-muted-foreground">
                                    {t("about.footerCreated")} <a href="https://iamovi.github.io/" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline">Hasan Ovi</a>
                                </div>
                                <div className="flex gap-4 text-xs font-bold uppercase tracking-wider">
                                    <Link to="/terms" className="hover:text-primary transition-colors">{t("about.footerTerms")}</Link>
                                    <Link to="/privacy" className="hover:text-primary transition-colors">{t("about.footerPrivacy")}</Link>
                                </div>
                            </footer>
                        </div>
                    </motion.div>

                    <div className="hidden lg:block lg:sticky lg:top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto pr-2 custom-scrollbar">
                        <Sidebar />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AboutPage;
