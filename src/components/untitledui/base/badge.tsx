"use client";

import type { MouseEventHandler, ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type BadgeColors = 
    | "gray" 
    | "brand" 
    | "error" 
    | "warning" 
    | "success" 
    | "gray-blue" 
    | "blue-light" 
    | "blue" 
    | "indigo" 
    | "purple" 
    | "pink" 
    | "orange";

export type BadgeTypes = "pill-color" | "badge-color" | "badge-modern";
export type Sizes = "sm" | "md" | "lg";
export type FlagTypes = "AU" | "US" | "GB" | "CA" | "DE" | "FR" | "IT" | "ES" | "NL" | "SE" | "NO" | "DK" | "FI" | "PL" | "CZ" | "HU" | "RO" | "BG" | "HR" | "SI" | "SK" | "EE" | "LV" | "LT" | "MT" | "CY" | "LU" | "IE" | "PT" | "GR" | "AT" | "BE" | "CH" | "IS" | "LI" | "MC" | "SM" | "VA" | "AD" | "BR" | "MX" | "AR" | "CL" | "CO" | "PE" | "VE" | "UY" | "PY" | "BO" | "EC" | "GY" | "SR" | "GF" | "FK" | "JP" | "KR" | "CN" | "IN" | "TH" | "VN" | "ID" | "MY" | "SG" | "PH" | "TW" | "HK" | "MO" | "MN" | "KZ" | "UZ" | "KG" | "TJ" | "TM" | "AF" | "PK" | "BD" | "LK" | "MV" | "BT" | "NP" | "MM" | "LA" | "KH" | "BN" | "TL" | "FJ" | "PG" | "SB" | "VU" | "NC" | "PF" | "WS" | "TO" | "KI" | "TV" | "NR" | "FM" | "MH" | "PW" | "CK" | "NU" | "TK" | "AS" | "GU" | "MP" | "VI" | "PR" | "DO" | "HT" | "JM" | "CU" | "BS" | "BB" | "TT" | "AG" | "DM" | "GD" | "KN" | "LC" | "VC" | "BZ" | "GT" | "HN" | "SV" | "NI" | "CR" | "PA" | "AW" | "AN" | "KY" | "TC" | "VG" | "AI" | "MS" | "GP" | "MQ" | "BL" | "MF" | "SX" | "CW" | "BQ" | "ZA" | "EG" | "LY" | "TN" | "DZ" | "MA" | "SD" | "SS" | "ET" | "ER" | "DJ" | "SO" | "KE" | "UG" | "TZ" | "RW" | "BI" | "MW" | "ZM" | "ZW" | "BW" | "NA" | "SZ" | "LS" | "MG" | "MU" | "SC" | "KM" | "YT" | "RE" | "MZ" | "AO" | "CD" | "CG" | "CM" | "CF" | "TD" | "NE" | "NG" | "BJ" | "TG" | "GH" | "BF" | "CI" | "LR" | "SL" | "GN" | "GW" | "GM" | "SN" | "ML" | "MR" | "CV" | "ST" | "GQ" | "GA" | "AO" | "ZM" | "ZW" | "BW" | "NA" | "SZ" | "LS" | "MG" | "MU" | "SC" | "KM" | "YT" | "RE" | "MZ" | "AO" | "CD" | "CG" | "CM" | "CF" | "TD" | "NE" | "NG" | "BJ" | "TG" | "GH" | "BF" | "CI" | "LR" | "SL" | "GN" | "GW" | "GM" | "SN" | "ML" | "MR" | "CV" | "ST" | "EQ" | "GA";

export type IconComponentType = React.ComponentType<{ className?: string }>;

export const filledColors: Record<BadgeColors, { root: string; addon: string; addonButton: string }> = {
    gray: {
        root: "bg-gray-50 text-gray-700 ring-gray-200",
        addon: "text-gray-500",
        addonButton: "hover:bg-gray-100 text-gray-400 hover:text-gray-500",
    },
    brand: {
        root: "bg-primary/10 text-primary ring-primary/20",
        addon: "text-primary/70",
        addonButton: "hover:bg-primary/20 text-primary/50 hover:text-primary/70",
    },
    error: {
        root: "bg-destructive/10 text-destructive ring-destructive/20",
        addon: "text-destructive/70",
        addonButton: "hover:bg-destructive/20 text-destructive/50 hover:text-destructive/70",
    },
    warning: {
        root: "bg-yellow-50 text-yellow-700 ring-yellow-200",
        addon: "text-yellow-500",
        addonButton: "hover:bg-yellow-100 text-yellow-400 hover:text-yellow-500",
    },
    success: {
        root: "bg-green-50 text-green-700 ring-green-200",
        addon: "text-green-500",
        addonButton: "hover:bg-green-100 text-green-400 hover:text-green-500",
    },
    "gray-blue": {
        root: "bg-slate-50 text-slate-700 ring-slate-200",
        addon: "text-slate-500",
        addonButton: "hover:bg-slate-100 text-slate-400 hover:text-slate-500",
    },
    "blue-light": {
        root: "bg-sky-50 text-sky-700 ring-sky-200",
        addon: "text-sky-500",
        addonButton: "hover:bg-sky-100 text-sky-400 hover:text-sky-500",
    },
    blue: {
        root: "bg-blue-50 text-blue-700 ring-blue-200",
        addon: "text-blue-500",
        addonButton: "hover:bg-blue-100 text-blue-400 hover:text-blue-500",
    },
    indigo: {
        root: "bg-indigo-50 text-indigo-700 ring-indigo-200",
        addon: "text-indigo-500",
        addonButton: "hover:bg-indigo-100 text-indigo-400 hover:text-indigo-500",
    },
    purple: {
        root: "bg-purple-50 text-purple-700 ring-purple-200",
        addon: "text-purple-500",
        addonButton: "hover:bg-purple-100 text-purple-400 hover:text-purple-500",
    },
    pink: {
        root: "bg-pink-50 text-pink-700 ring-pink-200",
        addon: "text-pink-500",
        addonButton: "hover:bg-pink-100 text-pink-400 hover:text-pink-500",
    },
    orange: {
        root: "bg-orange-50 text-orange-700 ring-orange-200",
        addon: "text-orange-500",
        addonButton: "hover:bg-orange-100 text-orange-400 hover:text-orange-500",
    },
};

const addonOnlyColors = Object.fromEntries(Object.entries(filledColors).map(([key, value]) => [key, { root: "", addon: value.addon }])) as Record<
    BadgeColors,
    { root: string; addon: string }
>;

const withPillTypes = {
    "pill-color": {
        common: "size-max flex items-center whitespace-nowrap rounded-full ring-1 ring-inset",
        styles: filledColors,
    },
    "badge-color": {
        common: "size-max flex items-center whitespace-nowrap rounded-md ring-1 ring-inset",
        styles: filledColors,
    },
    "badge-modern": {
        common: "size-max flex items-center whitespace-nowrap rounded-md ring-1 ring-inset shadow-sm",
        styles: {
            gray: {
                root: "bg-background text-foreground ring-border",
                addon: "text-muted-foreground",
                addonButton: "hover:bg-muted text-muted-foreground/70 hover:text-muted-foreground",
            },
        },
    },
};

const withBadgeTypes = {
    "pill-color": {
        common: "size-max flex items-center whitespace-nowrap rounded-full ring-1 ring-inset",
        styles: filledColors,
    },
    "badge-color": {
        common: "size-max flex items-center whitespace-nowrap rounded-md ring-1 ring-inset",
        styles: filledColors,
    },
    "badge-modern": {
        common: "size-max flex items-center whitespace-nowrap rounded-md ring-1 ring-inset bg-background text-foreground ring-border shadow-sm",
        styles: addonOnlyColors,
    },
};

export type BadgeColor<T extends BadgeTypes> = BadgeColors;

export interface BadgeProps<T extends BadgeTypes = BadgeTypes> {
    type?: T;
    size?: Sizes;
    color?: BadgeColor<T>;
    children: ReactNode;
    className?: string;
}

export const Badge = <T extends BadgeTypes>(props: BadgeProps<T>) => {
    const { type = "pill-color", size = "md", color = "gray", children } = props;
    const colors = withPillTypes[type];

    const pillSizes = {
        sm: "py-0.5 px-2 text-xs font-medium",
        md: "py-0.5 px-2.5 text-sm font-medium",
        lg: "py-1 px-3 text-sm font-medium",
    };
    const badgeSizes = {
        sm: "py-0.5 px-1.5 text-xs font-medium",
        md: "py-0.5 px-2 text-sm font-medium",
        lg: "py-1 px-2.5 text-sm font-medium rounded-lg",
    };

    const sizes = {
        "pill-color": pillSizes,
        "badge-color": badgeSizes,
        "badge-modern": badgeSizes,
    };

    return <span className={cn(colors.common, sizes[type][size], colors.styles[color].root, props.className)}>{children}</span>;
};

export interface BadgeWithDotProps<T extends BadgeTypes = BadgeTypes> {
    type?: T;
    size?: Sizes;
    color?: BadgeColor<T>;
    className?: string;
    children: ReactNode;
}

export const BadgeWithDot = <T extends BadgeTypes>(props: BadgeWithDotProps<T>) => {
    const { size = "md", color = "gray", type = "pill-color", className, children } = props;

    const colors = withBadgeTypes[type];

    const pillSizes = {
        sm: "gap-1 py-0.5 pl-1.5 pr-2 text-xs font-medium",
        md: "gap-1.5 py-0.5 pl-2 pr-2.5 text-sm font-medium",
        lg: "gap-1.5 py-1 pl-2.5 pr-3 text-sm font-medium",
    };

    const badgeSizes = {
        sm: "gap-1 py-0.5 px-1.5 text-xs font-medium",
        md: "gap-1.5 py-0.5 px-2 text-sm font-medium",
        lg: "gap-1.5 py-1 px-2.5 text-sm font-medium rounded-lg",
    };

    const sizes = {
        "pill-color": pillSizes,
        "badge-color": badgeSizes,
        "badge-modern": badgeSizes,
    };

    return (
        <span className={cn(colors.common, sizes[type][size], colors.styles[color].root, className)}>
            <div className={cn("size-2 rounded-full", colors.styles[color].addon)} />
            {children}
        </span>
    );
};

export interface BadgeWithIconProps<T extends BadgeTypes = BadgeTypes> {
    type?: T;
    size?: Sizes;
    color?: BadgeColor<T>;
    iconLeading?: IconComponentType;
    iconTrailing?: IconComponentType;
    children: ReactNode;
    className?: string;
}

export const BadgeWithIcon = <T extends BadgeTypes>(props: BadgeWithIconProps<T>) => {
    const { size = "md", color = "gray", type = "pill-color", iconLeading: IconLeading, iconTrailing: IconTrailing, children, className } = props;

    const colors = withBadgeTypes[type];

    const icon = IconLeading ? "leading" : "trailing";

    const pillSizes = {
        sm: {
            trailing: "gap-0.5 py-0.5 pl-2 pr-1.5 text-xs font-medium",
            leading: "gap-0.5 py-0.5 pr-2 pl-1.5 text-xs font-medium",
        },
        md: {
            trailing: "gap-1 py-0.5 pl-2.5 pr-2 text-sm font-medium",
            leading: "gap-1 py-0.5 pr-2.5 pl-2 text-sm font-medium",
        },
        lg: {
            trailing: "gap-1 py-1 pl-3 pr-2.5 text-sm font-medium",
            leading: "gap-1 py-1 pr-3 pl-2.5 text-sm font-medium",
        },
    };
    const badgeSizes = {
        sm: {
            trailing: "gap-0.5 py-0.5 pl-2 pr-1.5 text-xs font-medium",
            leading: "gap-0.5 py-0.5 pr-2 pl-1.5 text-xs font-medium",
        },
        md: {
            trailing: "gap-1 py-0.5 pl-2 pr-1.5 text-sm font-medium",
            leading: "gap-1 py-0.5 pr-2 pl-1.5 text-sm font-medium",
        },
        lg: {
            trailing: "gap-1 py-1 pl-2.5 pr-2 text-sm font-medium rounded-lg",
            leading: "gap-1 py-1 pr-2.5 pl-2 text-sm font-medium rounded-lg",
        },
    };

    const sizes = {
        "pill-color": pillSizes,
        "badge-color": badgeSizes,
        "badge-modern": badgeSizes,
    };

    return (
        <span className={cn(colors.common, sizes[type][size][icon], colors.styles[color].root, className)}>
            {IconLeading && <IconLeading className={cn(colors.styles[color].addon, "size-3")} />}
            {children}
            {IconTrailing && <IconTrailing className={cn(colors.styles[color].addon, "size-3")} />}
        </span>
    );
};

export interface BadgeWithButtonProps<T extends BadgeTypes = BadgeTypes> {
    type?: T;
    size?: Sizes;
    icon?: IconComponentType;
    color?: BadgeColor<T>;
    children: ReactNode;
    /**
     * The label for the button.
     */
    buttonLabel?: string;
    /**
     * The click event handler for the button.
     */
    onButtonClick?: MouseEventHandler<HTMLButtonElement>;
}

export const BadgeWithButton = <T extends BadgeTypes>(props: BadgeWithButtonProps<T>) => {
    const { size = "md", color = "gray", type = "pill-color", icon: Icon = X, buttonLabel, children } = props;

    const colors = withPillTypes[type];

    const pillSizes = {
        sm: "gap-0.5 py-0.5 pl-2 pr-0.75 text-xs font-medium",
        md: "gap-0.5 py-0.5 pl-2.5 pr-1 text-sm font-medium",
        lg: "gap-0.5 py-1 pl-3 pr-1.5 text-sm font-medium",
    };
    const badgeSizes = {
        sm: "gap-0.5 py-0.5 pl-1.5 pr-0.75 text-xs font-medium",
        md: "gap-0.5 py-0.5 pl-2 pr-1 text-sm font-medium",
        lg: "gap-0.5 py-1 pl-2.5 pr-1.5 text-sm font-medium rounded-lg",
    };

    const sizes = {
        "pill-color": pillSizes,
        "badge-color": badgeSizes,
        "badge-modern": badgeSizes,
    };

    return (
        <span className={cn(colors.common, sizes[type][size], colors.styles[color].root)}>
            {children}
            <button
                type="button"
                aria-label={buttonLabel}
                onClick={props.onButtonClick}
                className={cn(
                    "flex cursor-pointer items-center justify-center p-0.5 outline-none transition duration-100 ease-linear focus-visible:outline-2 focus-visible:outline-ring",
                    colors.styles[color].addonButton,
                    type === "pill-color" ? "rounded-full" : "rounded-[3px]",
                )}
            >
                <Icon className="size-3 transition-inherit-all" />
            </button>
        </span>
    );
};

export interface BadgeIconProps<T extends BadgeTypes = BadgeTypes> {
    type?: T;
    size?: Sizes;
    icon: IconComponentType;
    color?: BadgeColor<T>;
    children?: ReactNode;
}

export const BadgeIcon = <T extends BadgeTypes>(props: BadgeIconProps<T>) => {
    const { size = "md", color = "gray", type = "pill-color", icon: Icon } = props;

    const colors = withPillTypes[type];

    const pillSizes = {
        sm: "p-1.25",
        md: "p-1.5",
        lg: "p-2",
    };

    const badgeSizes = {
        sm: "p-1.25",
        md: "p-1.5",
        lg: "p-2 rounded-lg",
    };

    const sizes = {
        "pill-color": pillSizes,
        "badge-color": badgeSizes,
        "badge-modern": badgeSizes,
    };

    return (
        <span className={cn(colors.common, sizes[type][size], colors.styles[color].root)}>
            <Icon className={cn("size-3", colors.styles[color].addon)} />
        </span>
    );
};