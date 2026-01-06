"use client";

import {ClerkProvider, useAuth} from "@clerk/nextjs";
import {Authenticated, AuthLoading, ConvexReactClient, Unauthenticated,} from "convex/react";
import {ConvexProviderWithClerk} from "convex/react-clerk";
import type {PropsWithChildren} from "react";
import {AuthLoadingView, UnauthenticatedView} from "@/features/auth";
import {ThemeProvider} from "./theme-provider";

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL as string,
);

export const Providers = ({ children }: PropsWithChildren) => {
  return (
    <ClerkProvider>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Authenticated>{children}</Authenticated>
          <Unauthenticated>
            <UnauthenticatedView />
          </Unauthenticated>
          <AuthLoading>
            <AuthLoadingView />
          </AuthLoading>
        </ThemeProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
};
