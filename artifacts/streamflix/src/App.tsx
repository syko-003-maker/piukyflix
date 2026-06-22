import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useSyncUser, useGetMe } from "@workspace/api-client-react";

// Layouts & Pages
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Browse from "@/pages/browse";
import ContentDetail from "@/pages/content-detail";
import Watch from "@/pages/watch";
import Search from "@/pages/search";
import Favorites from "@/pages/favorites";
import History from "@/pages/history";
import Requests from "@/pages/requests";

import AdminDashboard from "@/pages/admin/index";
import AdminContent from "@/pages/admin/content";
import AdminCategories from "@/pages/admin/categories";
import AdminUsers from "@/pages/admin/users";
import AdminInvite from "@/pages/admin/invite";
import AdminAds from "@/pages/admin/ads";

const queryClient = new QueryClient();

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(357 92% 47%)",
    colorForeground: "hsl(0 0% 100%)",
    colorMutedForeground: "hsl(215 20% 65%)",
    colorDanger: "hsl(0 62.8% 30.6%)",
    colorBackground: "hsl(240 33% 6%)",
    colorInput: "hsl(215 28% 17%)",
    colorInputForeground: "hsl(0 0% 100%)",
    colorNeutral: "hsl(215 28% 17%)",
    fontFamily: "'Inter', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-card rounded-2xl w-[440px] max-w-full overflow-hidden border border-border",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-foreground font-bold text-2xl",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-foreground font-medium",
    formFieldLabel: "text-foreground font-medium",
    footerActionLink: "text-primary hover:text-primary/90 font-medium",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground",
    identityPreviewEditButton: "text-primary hover:text-primary/90",
    formFieldSuccessText: "text-green-500",
    alertText: "text-destructive-foreground",
    logoBox: "flex justify-center mb-4",
    logoImage: "h-12 w-auto",
    socialButtonsBlockButton: "bg-secondary hover:bg-secondary/80 border border-border text-foreground",
    formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground font-bold",
    formFieldInput: "bg-input border-border text-foreground focus:ring-primary",
    footerAction: "justify-center",
    dividerLine: "bg-border",
    alert: "bg-destructive text-destructive-foreground",
    otpCodeFieldInput: "bg-input border-border text-foreground focus:ring-primary",
    formFieldRow: "mb-4",
    main: "w-full",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  const syncUser = useSyncUser();

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      const isInitial = prevUserIdRef.current === undefined;
      const changed = !isInitial && prevUserIdRef.current !== userId;

      if (changed) {
        queryClient.clear();
      }
      // Sync on sign-in change AND on initial load when already signed in, so
      // role/profile updates (e.g. admin promotion) propagate without a sign-out/in.
      if (userId && (changed || isInitial)) {
        syncUser.mutate(undefined, {
          onSuccess: () => queryClient.invalidateQueries(),
        });
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient, syncUser]);

  return null;
}

// Stubs for now
function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/browse" />
      </Show>
      <Show when="signed-out">
        <Home />
      </Show>
    </>
  );
}

function AdminRoute({ component: Component, adminOnly }: { component: any; adminOnly?: boolean }) {
  const { data: user, isLoading } = useGetMe();

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center animate-pulse" />;

  const allowed = !!user && (user.role === 'admin' || (!adminOnly && user.role === 'moderator'));
  if (!allowed) {
    return <Redirect to="/browse" />;
  }

  return <Component />;
}

// Requires sign-in to view any content page; signed-out users go to sign-in.
function Protected({ component: Component }: { component: any }) {
  return (
    <>
      <Show when="signed-in">
        <Component />
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/browse"><Protected component={Browse} /></Route>
          <Route path="/content/:id"><Protected component={ContentDetail} /></Route>
          <Route path="/watch/:id"><Protected component={Watch} /></Route>
          <Route path="/search"><Protected component={Search} /></Route>
          <Route path="/favorites"><Protected component={Favorites} /></Route>
          <Route path="/history"><Protected component={History} /></Route>
          <Route path="/requests"><Protected component={Requests} /></Route>
          
          {/* Admin Routes */}
          <Route path="/admin">
            <AdminRoute component={AdminDashboard} />
          </Route>
          <Route path="/admin/content">
            <AdminRoute component={AdminContent} />
          </Route>
          <Route path="/admin/categories">
            <AdminRoute component={AdminCategories} />
          </Route>
          <Route path="/admin/users">
            <AdminRoute component={AdminUsers} adminOnly />
          </Route>
          <Route path="/admin/invite">
            <AdminRoute component={AdminInvite} adminOnly />
          </Route>
          <Route path="/admin/ads">
            <AdminRoute component={AdminAds} adminOnly />
          </Route>

          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route component={NotFound} />
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <TooltipProvider>
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
