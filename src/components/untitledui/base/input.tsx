"use client";

import { type ComponentType, type HTMLAttributes, type ReactNode, type Ref, createContext, useContext } from "react";
import { HelpCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface BaseProps {
    /** Label text for the input */
    label?: string;
    /** Helper text displayed below the input */
    hint?: ReactNode;
}

export interface TextFieldProps
    extends BaseProps,
        Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
    ref?: Ref<HTMLDivElement>;
    isInvalid?: boolean;
    isRequired?: boolean;
    size?: "sm" | "md";
    wrapperClassName?: string;
    inputClassName?: string;
    iconClassName?: string;
    tooltipClassName?: string;
}

export interface InputBaseProps extends Omit<TextFieldProps, "label" | "hint"> {
    /** Tooltip message on hover. */
    tooltip?: string;
    /** Placeholder text. */
    placeholder?: string;
    /** Keyboard shortcut to display. */
    shortcut?: string | boolean;
    ref?: Ref<HTMLInputElement>;
    groupRef?: Ref<HTMLDivElement>;
    /** Icon component to display on the left side of the input. */
    icon?: ComponentType<HTMLAttributes<HTMLOrSVGElement>>;
    /** Whether the input is disabled. */
    isDisabled?: boolean;
}

export const InputBase = ({
    ref,
    tooltip,
    shortcut,
    groupRef,
    size = "sm",
    isInvalid = false,
    isDisabled = false,
    icon: Icon,
    placeholder,
    wrapperClassName,
    tooltipClassName,
    inputClassName,
    iconClassName,
    ...inputProps
}: InputBaseProps) => {
    // Check if the input has a leading icon or tooltip
    const hasTrailingIcon = tooltip || isInvalid;
    const hasLeadingIcon = Icon;

    // If the input is inside a `TextFieldContext`, use its context to simplify applying styles
    const context = useContext(TextFieldContext);

    const inputSize = context?.size || size;

    const sizes = {
        sm: {
            root: cn("px-3 py-2", hasTrailingIcon && "pr-9", hasLeadingIcon && "pl-10"),
            iconLeading: "left-3",
            iconTrailing: "right-3",
            shortcut: "pr-2.5",
        },
        md: {
            root: cn("px-3.5 py-2.5", hasTrailingIcon && "pr-9.5", hasLeadingIcon && "pl-10.5"),
            iconLeading: "left-3.5",
            iconTrailing: "right-3.5",
            shortcut: "pr-3",
        },
    };

    return (
        <div
            ref={groupRef}
            className={cn(
                "relative flex w-full flex-row place-content-center place-items-center rounded-lg bg-background shadow-sm ring-1 ring-border transition-shadow duration-100 ease-linear ring-inset",
                "focus-within:ring-2 focus-within:ring-ring",
                // Disabled state styles
                isDisabled && "cursor-not-allowed bg-muted ring-muted",
                // Invalid state styles
                isInvalid && "ring-destructive",
                // Invalid state with focus-within styles
                isInvalid && "focus-within:ring-2 focus-within:ring-destructive",
                context?.wrapperClassName,
                wrapperClassName,
            )}
        >
            {/* Leading icon and Payment icon */}
            {Icon && (
                <Icon
                    className={cn(
                        "pointer-events-none absolute size-5 text-muted-foreground",
                        isDisabled && "text-muted-foreground/50",
                        sizes[inputSize].iconLeading,
                        context?.iconClassName,
                        iconClassName,
                    )}
                />
            )}

            {/* Input field */}
            <input
                {...inputProps}
                ref={ref}
                placeholder={placeholder}
                disabled={isDisabled}
                className={cn(
                    "m-0 w-full bg-transparent text-sm text-foreground ring-0 outline-none placeholder:text-muted-foreground",
                    isDisabled && "cursor-not-allowed text-muted-foreground",
                    sizes[inputSize].root,
                    context?.inputClassName,
                    inputClassName,
                )}
            />

            {/* Tooltip and help icon */}
            {tooltip && !isInvalid && (
                <div
                    className={cn(
                        "absolute cursor-pointer text-muted-foreground transition duration-200 hover:text-foreground focus:text-foreground",
                        sizes[inputSize].iconTrailing,
                        context?.tooltipClassName,
                        tooltipClassName,
                    )}
                    title={tooltip}
                >
                    <HelpCircle className="size-4" />
                </div>
            )}

            {/* Invalid icon */}
            {isInvalid && (
                <Info
                    className={cn(
                        "pointer-events-none absolute size-4 text-destructive",
                        sizes[inputSize].iconTrailing,
                        context?.tooltipClassName,
                        tooltipClassName,
                    )}
                />
            )}

            {/* Shortcut */}
            {shortcut && (
                <div
                    className={cn(
                        "pointer-events-none absolute inset-y-0.5 right-0.5 z-10 flex items-center rounded-r-[inherit] bg-gradient-to-r from-transparent to-background to-40% pl-8",
                        sizes[inputSize].shortcut,
                    )}
                >
                    <span
                        className={cn(
                            "pointer-events-none rounded px-1 py-px text-xs font-medium text-muted-foreground ring-1 ring-border select-none ring-inset",
                            isDisabled && "bg-transparent text-muted-foreground/50",
                        )}
                        aria-hidden="true"
                    >
                        {typeof shortcut === "string" ? shortcut : "⌘K"}
                    </span>
                </div>
            )}
        </div>
    );
};

InputBase.displayName = "InputBase";

const TextFieldContext = createContext<TextFieldProps>({});

export const TextField = ({ className, ...props }: TextFieldProps) => {
    return (
        <TextFieldContext.Provider value={props}>
            <div
                data-input-wrapper
                className={cn("group flex h-max w-full flex-col items-start justify-start gap-1.5", className)}
            >
                {props.children}
            </div>
        </TextFieldContext.Provider>
    );
};

TextField.displayName = "TextField";

export interface InputProps extends InputBaseProps {
    /** Label text for the input */
    label?: string;
    /** Helper text displayed below the input */
    hint?: ReactNode;
    /** Whether to hide required indicator from label */
    hideRequiredIndicator?: boolean;
}

export const Input = ({
    size = "sm",
    placeholder,
    icon: Icon,
    label,
    hint,
    shortcut,
    hideRequiredIndicator,
    className,
    ref,
    groupRef,
    tooltip,
    iconClassName,
    inputClassName,
    wrapperClassName,
    tooltipClassName,
    isRequired = false,
    isInvalid = false,
    ...props
}: InputProps) => {
    return (
        <TextField aria-label={!label ? placeholder : undefined} {...props} className={className}>
            {label && (
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {label}
                    {!hideRequiredIndicator && isRequired && <span className="text-destructive ml-1">*</span>}
                </label>
            )}

            <InputBase
                {...{
                    ref,
                    groupRef,
                    size,
                    placeholder,
                    icon: Icon,
                    shortcut,
                    iconClassName,
                    inputClassName,
                    wrapperClassName,
                    tooltipClassName,
                    tooltip,
                    isRequired,
                    isInvalid,
                    ...props
                }}
            />

            {hint && (
                <p className={cn("text-sm text-muted-foreground", isInvalid && "text-destructive")}>
                    {hint}
                </p>
            )}
        </TextField>
    );
};

Input.displayName = "Input";