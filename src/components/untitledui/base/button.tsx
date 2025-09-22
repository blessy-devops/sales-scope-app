"use client";

import type { AnchorHTMLAttributes, ButtonHTMLAttributes, DetailedHTMLProps, FC, ReactNode } from "react";
import React, { isValidElement } from "react";
import { cn } from "@/lib/utils";

export const styles = {
    common: {
        root: [
            "group relative inline-flex h-max cursor-pointer items-center justify-center whitespace-nowrap outline-brand transition duration-100 ease-linear before:absolute focus-visible:outline-2 focus-visible:outline-offset-2",
            // When button is used within `InputGroup`
            "in-data-input-wrapper:shadow-xs in-data-input-wrapper:focus:!z-50 in-data-input-wrapper:in-data-leading:-mr-px in-data-input-wrapper:in-data-leading:rounded-r-none in-data-input-wrapper:in-data-leading:before:rounded-r-none in-data-input-wrapper:in-data-trailing:-ml-px in-data-input-wrapper:in-data-trailing:rounded-l-none in-data-input-wrapper:in-data-trailing:before:rounded-l-none",
            // Disabled styles
            "disabled:cursor-not-allowed disabled:text-muted-foreground",
            // Icon styles
            "disabled:*:data-icon:text-muted-foreground",
            // Same as `icon` but for SSR icons that cannot be passed to the client as functions.
            "*:data-icon:pointer-events-none *:data-icon:size-5 *:data-icon:shrink-0 *:data-icon:transition-inherit-all",
        ].join(" "),
        icon: "pointer-events-none size-5 shrink-0 transition-inherit-all",
    },
    sizes: {
        sm: {
            root: [
                "gap-1 rounded-lg px-3 py-2 text-sm font-semibold before:rounded-[7px] data-icon-only:p-2",
                "in-data-input-wrapper:px-3.5 in-data-input-wrapper:py-2.5 in-data-input-wrapper:data-icon-only:p-2.5",
            ].join(" "),
            linkRoot: "gap-1",
        },
        md: {
            root: [
                "gap-1 rounded-lg px-3.5 py-2.5 text-sm font-semibold before:rounded-[7px] data-icon-only:p-2.5",
                "in-data-input-wrapper:gap-1.5 in-data-input-wrapper:px-4 in-data-input-wrapper:text-md in-data-input-wrapper:data-icon-only:p-3",
            ].join(" "),
            linkRoot: "gap-1",
        },
        lg: {
            root: "gap-1.5 rounded-lg px-4 py-2.5 text-md font-semibold before:rounded-[7px] data-icon-only:p-3",
            linkRoot: "gap-1.5",
        },
        xl: {
            root: "gap-1.5 rounded-lg px-4.5 py-3 text-md font-semibold before:rounded-[7px] data-icon-only:p-3.5",
            linkRoot: "gap-1.5",
        },
    },

    colors: {
        primary: {
            root: [
                "bg-primary text-primary-foreground shadow-sm ring-1 ring-transparent ring-inset hover:bg-primary/90 data-loading:bg-primary/90",
                // Inner border gradient
                "before:absolute before:inset-px before:border before:border-white/12 before:mask-b-from-0%",
                // Disabled styles
                "disabled:bg-muted disabled:shadow-sm disabled:ring-muted",
                // Icon styles
                "*:data-icon:text-primary-foreground hover:*:data-icon:text-primary-foreground/90",
            ].join(" "),
        },
        secondary: {
            root: [
                "bg-secondary text-secondary-foreground shadow-sm ring-1 ring-border ring-inset hover:bg-secondary/80 hover:text-secondary-foreground data-loading:bg-secondary/80",
                // Disabled styles
                "disabled:shadow-sm disabled:ring-muted",
                // Icon styles
                "*:data-icon:text-muted-foreground hover:*:data-icon:text-muted-foreground",
            ].join(" "),
        },
        tertiary: {
            root: [
                "text-foreground hover:bg-accent hover:text-accent-foreground data-loading:bg-accent",
                // Icon styles
                "*:data-icon:text-muted-foreground hover:*:data-icon:text-muted-foreground",
            ].join(" "),
        },
        "link-gray": {
            root: [
                "justify-normal rounded p-0! text-muted-foreground hover:text-foreground",
                // Inner text underline
                "*:data-text:underline *:data-text:decoration-transparent *:data-text:underline-offset-2 hover:*:data-text:decoration-current",
                // Icon styles
                "*:data-icon:text-muted-foreground hover:*:data-icon:text-foreground",
            ].join(" "),
        },
        "link-color": {
            root: [
                "justify-normal rounded p-0! text-primary hover:text-primary/80",
                // Inner text underline
                "*:data-text:underline *:data-text:decoration-transparent *:data-text:underline-offset-2 hover:*:data-text:decoration-current",
                // Icon styles
                "*:data-icon:text-primary hover:*:data-icon:text-primary/80",
            ].join(" "),
        },
        "primary-destructive": {
            root: [
                "bg-destructive text-destructive-foreground shadow-sm ring-1 ring-transparent outline-destructive ring-inset",
                // Inner border gradient
                "before:absolute before:inset-px before:border before:border-white/12 before:mask-b-from-0%",
                // Disabled styles
                "disabled:bg-muted disabled:shadow-sm disabled:ring-muted",
                // Icon styles
                "*:data-icon:text-destructive-foreground hover:*:data-icon:text-destructive-foreground/90",
            ].join(" "),
        },
        "secondary-destructive": {
            root: [
                "bg-secondary text-destructive shadow-sm ring-1 ring-destructive/20 outline-destructive ring-inset hover:bg-destructive/10 hover:text-destructive data-loading:bg-destructive/10",
                // Disabled styles
                "disabled:bg-secondary disabled:shadow-sm disabled:ring-muted",
                // Icon styles
                "*:data-icon:text-destructive/70 hover:*:data-icon:text-destructive",
            ].join(" "),
        },
        "tertiary-destructive": {
            root: [
                "text-destructive outline-destructive hover:bg-destructive/10 hover:text-destructive data-loading:bg-destructive/10",
                // Icon styles
                "*:data-icon:text-destructive/70 hover:*:data-icon:text-destructive",
            ].join(" "),
        },
        "link-destructive": {
            root: [
                "justify-normal rounded p-0! text-destructive outline-destructive hover:text-destructive/80",
                // Inner text underline
                "*:data-text:underline *:data-text:decoration-transparent *:data-text:underline-offset-2 hover:*:data-text:decoration-current",
                // Icon styles
                "*:data-icon:text-destructive/70 hover:*:data-icon:text-destructive/80",
            ].join(" "),
        },
    },
};

/**
 * Common props shared between button and anchor variants
 */
export interface CommonProps {
    /** Disables the button and shows a disabled state */
    isDisabled?: boolean;
    /** Shows a loading spinner and disables the button */
    isLoading?: boolean;
    /** The size variant of the button */
    size?: keyof typeof styles.sizes;
    /** The color variant of the button */
    color?: keyof typeof styles.colors;
    /** Icon component or element to show before the text */
    iconLeading?: FC<{ className?: string }> | ReactNode;
    /** Icon component or element to show after the text */
    iconTrailing?: FC<{ className?: string }> | ReactNode;
    /** Removes horizontal padding from the text content */
    noTextPadding?: boolean;
    /** When true, keeps the text visible during loading state */
    showTextWhileLoading?: boolean;
}

/**
 * Props for the button variant (non-link)
 */
export interface ButtonProps extends CommonProps, DetailedHTMLProps<Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color">, HTMLButtonElement> {}

/**
 * Props for the link variant (anchor tag)
 */
interface LinkProps extends CommonProps, DetailedHTMLProps<Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "color">, HTMLAnchorElement> {}

/** Union type of button and link props */
export type Props = ButtonProps | LinkProps;

export const Button = ({
    size = "sm",
    color = "primary",
    children,
    className,
    noTextPadding,
    iconLeading: IconLeading,
    iconTrailing: IconTrailing,
    isDisabled: disabled,
    isLoading: loading,
    showTextWhileLoading,
    ...otherProps
}: Props) => {
    const href = "href" in otherProps ? otherProps.href : undefined;
    const Component = href ? "a" : "button";

    const isIcon = (IconLeading || IconTrailing) && !children;
    const isLinkType = ["link-gray", "link-color", "link-destructive"].includes(color);

    noTextPadding = isLinkType || noTextPadding;

    let props = {};

    if (href) {
        props = {
            ...otherProps,
            href: disabled ? undefined : href,
            ...(disabled ? { "data-disabled": true } : {}),
        };
    } else {
        props = {
            ...otherProps,
            type: otherProps.type || "button",
            disabled: disabled || loading,
        };
    }

    return (
        <Component
            data-loading={loading ? true : undefined}
            data-icon-only={isIcon ? true : undefined}
            {...props}
            className={cn(
                styles.common.root,
                styles.sizes[size].root,
                styles.colors[color].root,
                isLinkType && styles.sizes[size].linkRoot,
                (loading || (href && (disabled || loading))) && "pointer-events-none",
                // If in `loading` state, hide everything except the loading icon (and text if `showTextWhileLoading` is true).
                loading && (showTextWhileLoading ? "[&>*:not([data-icon=loading]):not([data-text])]:hidden" : "[&>*:not([data-icon=loading])]:invisible"),
                className,
            )}
        >
            {/* Leading icon */}
            {isValidElement(IconLeading) && IconLeading}
            {typeof IconLeading === "function" && <IconLeading data-icon="leading" className={styles.common.icon} />}

            {loading && (
                <svg
                    fill="none"
                    data-icon="loading"
                    viewBox="0 0 20 20"
                    className={cn(styles.common.icon, !showTextWhileLoading && "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2")}
                >
                    {/* Background circle */}
                    <circle className="stroke-current opacity-30" cx="10" cy="10" r="8" fill="none" strokeWidth="2" />
                    {/* Spinning circle */}
                    <circle
                        className="origin-center animate-spin stroke-current"
                        cx="10"
                        cy="10"
                        r="8"
                        fill="none"
                        strokeWidth="2"
                        strokeDasharray="12.5 50"
                        strokeLinecap="round"
                    />
                </svg>
            )}

            {children && (
                <span data-text className={cn("transition-inherit-all", !noTextPadding && "px-0.5")}>
                    {children}
                </span>
            )}

            {/* Trailing icon */}
            {isValidElement(IconTrailing) && IconTrailing}
            {typeof IconTrailing === "function" && <IconTrailing data-icon="trailing" className={styles.common.icon} />}
        </Component>
    );
};
