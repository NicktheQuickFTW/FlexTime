(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/frontend/lib/utils.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "cn": (()=>cn)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-client] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/frontend/src/components/ui/FlexTimeShinyButton.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "FlexTimeGlassButton": (()=>FlexTimeGlassButton),
    "FlexTimeNeonButton": (()=>FlexTimeNeonButton),
    "FlexTimePrimaryButton": (()=>FlexTimePrimaryButton),
    "FlexTimeSecondaryButton": (()=>FlexTimeSecondaryButton),
    "FlexTimeShinyButton": (()=>FlexTimeShinyButton),
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/utils.ts [app-client] (ecmascript)");
"use client";
;
;
;
const animationProps = {
    initial: {
        "--x": "100%",
        scale: 0.8
    },
    animate: {
        "--x": "-100%",
        scale: 1
    },
    whileTap: {
        scale: 0.95
    },
    transition: {
        repeat: Infinity,
        repeatType: "loop",
        repeatDelay: 1,
        type: "spring",
        stiffness: 20,
        damping: 15,
        mass: 2,
        scale: {
            type: "spring",
            stiffness: 200,
            damping: 5,
            mass: 0.5
        }
    }
};
const FlexTimeShinyButton = ({ children, className, variant = 'primary', ...props })=>{
    const variantStyles = {
        primary: {
            base: "bg-black dark:bg-[color:var(--ft-neon)] text-white dark:text-black border border-black dark:border-[color:var(--ft-neon)] hover:bg-gray-800 dark:hover:bg-[color:var(--ft-neon)]/80 shadow-lg hover:shadow-[color:var(--ft-neon-glow)]",
            shine: "var(--ft-neon)"
        },
        secondary: {
            base: "bg-white/80 dark:bg-transparent border border-white/60 dark:border-gray-600 text-black dark:text-white hover:bg-white/90 hover:border-white/80 dark:hover:border-[color:var(--ft-neon)] dark:hover:bg-[color:var(--ft-neon)]/10 backdrop-blur-sm",
            shine: "var(--ft-neon)"
        },
        neon: {
            base: "bg-black dark:bg-black border-2 border-black dark:border-[color:var(--ft-neon)] text-white dark:text-white hover:bg-gray-800 dark:hover:bg-[color:var(--ft-neon)]/10 shadow-[0_0_20px_rgba(0,191,255,0.4)] hover:shadow-[0_0_25px_rgba(0,191,255,0.6)]",
            shine: "var(--ft-neon)"
        },
        glass: {
            base: "ft-glass-card text-black dark:text-white border border-gray-200 dark:border-[color:var(--ft-glass-border)] hover:border-black dark:hover:border-[color:var(--ft-neon)]/50 backdrop-blur-xl",
            shine: "var(--ft-neon)"
        }
    };
    const currentVariant = variantStyles[variant];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].button, {
        ...animationProps,
        ...props,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("relative rounded-lg px-6 py-3 font-medium transition-all duration-300 ease-in-out ft-font-ui uppercase tracking-wide", currentVariant.base, className),
        style: {
            '--primary': 'var(--ft-neon)'
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "relative block size-full text-sm font-semibold",
                style: {
                    maskImage: `linear-gradient(-75deg, ${currentVariant.shine} calc(var(--x) + 20%), transparent calc(var(--x) + 30%), ${currentVariant.shine} calc(var(--x) + 100%))`
                },
                children: children
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/FlexTimeShinyButton.tsx",
                lineNumber: 84,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                style: {
                    mask: "linear-gradient(rgb(0,0,0), rgb(0,0,0)) content-box,linear-gradient(rgb(0,0,0), rgb(0,0,0))",
                    maskComposite: "exclude",
                    // Move sx properties into the style object
                    background: `linear-gradient(-75deg, var(--ft-neon-glow) calc(var(--x) + 20%), var(--ft-neon) calc(var(--x) + 25%), var(--ft-neon-glow) calc(var(--x) + 100%))`
                },
                className: "absolute inset-0 z-10 block rounded-[inherit] p-px"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/FlexTimeShinyButton.tsx",
                lineNumber: 92,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/ui/FlexTimeShinyButton.tsx",
        lineNumber: 71,
        columnNumber: 5
    }, this);
};
_c = FlexTimeShinyButton;
const FlexTimePrimaryButton = (props)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FlexTimeShinyButton, {
        variant: "primary",
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/FlexTimeShinyButton.tsx",
        lineNumber: 107,
        columnNumber: 3
    }, this);
_c1 = FlexTimePrimaryButton;
const FlexTimeSecondaryButton = (props)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FlexTimeShinyButton, {
        variant: "secondary",
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/FlexTimeShinyButton.tsx",
        lineNumber: 111,
        columnNumber: 3
    }, this);
_c2 = FlexTimeSecondaryButton;
const FlexTimeNeonButton = (props)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FlexTimeShinyButton, {
        variant: "neon",
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/FlexTimeShinyButton.tsx",
        lineNumber: 115,
        columnNumber: 3
    }, this);
_c3 = FlexTimeNeonButton;
const FlexTimeGlassButton = (props)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FlexTimeShinyButton, {
        variant: "glass",
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/FlexTimeShinyButton.tsx",
        lineNumber: 119,
        columnNumber: 3
    }, this);
_c4 = FlexTimeGlassButton;
const __TURBOPACK__default__export__ = FlexTimeShinyButton;
var _c, _c1, _c2, _c3, _c4;
__turbopack_context__.k.register(_c, "FlexTimeShinyButton");
__turbopack_context__.k.register(_c1, "FlexTimePrimaryButton");
__turbopack_context__.k.register(_c2, "FlexTimeSecondaryButton");
__turbopack_context__.k.register(_c3, "FlexTimeNeonButton");
__turbopack_context__.k.register(_c4, "FlexTimeGlassButton");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/frontend/src/components/ui/FTLogo.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "FTLogo": (()=>FTLogo),
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/image.js [app-client] (ecmascript)");
;
;
const FTLogo = ({ variant = 'light', size = 'md', className = '', alt = 'FlexTime', onClick, showText = false, customText })=>{
    // Size mapping
    const sizeMap = {
        xs: 20,
        sm: 28,
        md: 40,
        lg: 56,
        xl: 80
    };
    const logoSize = typeof size === 'number' ? size : sizeMap[size];
    // Logo path mapping to actual files
    const logoPath = {
        light: '/logos/flextime/flextime-light.svg',
        dark: '/logos/flextime/flextime-dark.svg',
        white: '/logos/flextime/flextime-white240x240.svg',
        black: '/logos/flextime/flextime-black240x240.svg'
    }[variant];
    const containerClasses = `ft-logo-container ${className} ${onClick ? 'cursor-pointer' : ''}`;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `${containerClasses} flex items-center gap-2`,
        onClick: onClick,
        style: {
            transition: 'all 0.3s ease'
        },
        onMouseEnter: (e)=>{
            if (onClick) {
                e.currentTarget.style.transform = 'scale(1.05)';
            }
        },
        onMouseLeave: (e)=>{
            if (onClick) {
                e.currentTarget.style.transform = 'scale(1)';
            }
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                src: logoPath,
                alt: alt,
                width: logoSize,
                height: logoSize,
                className: `ft-logo ft-logo-${variant} object-contain`,
                priority: true
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/FTLogo.tsx",
                lineNumber: 87,
                columnNumber: 7
            }, this),
            showText && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "ft-logo-text font-ft-brand font-bold uppercase bg-gradient-to-r from-black to-[color:var(--ft-neon)] dark:from-white dark:to-[color:var(--ft-neon)] bg-clip-text text-transparent",
                style: {
                    fontSize: logoSize * 0.6
                },
                children: customText || 'FLEXTIME'
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/FTLogo.tsx",
                lineNumber: 96,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/ui/FTLogo.tsx",
        lineNumber: 70,
        columnNumber: 5
    }, this);
};
_c = FTLogo;
const __TURBOPACK__default__export__ = FTLogo;
var _c;
__turbopack_context__.k.register(_c, "FTLogo");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/frontend/components/ui/toggle.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "Toggle": (()=>Toggle),
    "toggleVariants": (()=>toggleVariants)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toggle$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-toggle/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/utils.ts [app-client] (ecmascript)");
;
;
;
;
;
const toggleVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cva"])("inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground", {
    variants: {
        variant: {
            default: "bg-transparent",
            outline: "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground"
        },
        size: {
            default: "h-10 px-3",
            sm: "h-9 px-2.5",
            lg: "h-11 px-5"
        }
    },
    defaultVariants: {
        variant: "default",
        size: "default"
    }
});
const Toggle = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c = ({ className, variant, size, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toggle$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Root"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])(toggleVariants({
            variant,
            size,
            className
        })),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/components/ui/toggle.tsx",
        lineNumber: 34,
        columnNumber: 3
    }, this));
_c1 = Toggle;
Toggle.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toggle$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Root"].displayName;
;
var _c, _c1;
__turbopack_context__.k.register(_c, "Toggle$React.forwardRef");
__turbopack_context__.k.register(_c1, "Toggle");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/frontend/src/components/ui/FlexTimeThemeToggle.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "FlexTimeThemeToggle": (()=>FlexTimeThemeToggle)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sun$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sun$3e$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/icons/sun.mjs [app-client] (ecmascript) <export default as Sun>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$moon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Moon$3e$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/icons/moon.mjs [app-client] (ecmascript) <export default as Moon>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$toggle$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/components/ui/toggle.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
function FlexTimeThemeToggle() {
    _s();
    const [isDark, setIsDark] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "FlexTimeThemeToggle.useEffect": ()=>{
            // Check for saved theme or system preference
            const savedTheme = localStorage.getItem('flextime-theme-mode');
            const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const shouldBeDark = savedTheme === 'dark' || !savedTheme && systemDark;
            setIsDark(shouldBeDark);
            // Apply theme to html element
            if (shouldBeDark) {
                document.documentElement.classList.add('dark');
                document.documentElement.classList.remove('light');
            } else {
                document.documentElement.classList.add('light');
                document.documentElement.classList.remove('dark');
            }
        }
    }["FlexTimeThemeToggle.useEffect"], []);
    const toggleTheme = ()=>{
        const newIsDark = !isDark;
        setIsDark(newIsDark);
        // Save to localStorage
        localStorage.setItem('flextime-theme-mode', newIsDark ? 'dark' : 'light');
        // Apply to html element
        if (newIsDark) {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
        } else {
            document.documentElement.classList.add('light');
            document.documentElement.classList.remove('dark');
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$toggle$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Toggle"], {
        pressed: isDark,
        onPressedChange: toggleTheme,
        "aria-label": `Switch to ${isDark ? 'light' : 'dark'} mode`,
        className: "relative w-12 h-12 rounded-lg bg-white/10 dark:bg-white/10 backdrop-blur-sm border border-white/20 dark:border-white/20 hover:bg-white/20 dark:hover:bg-white/20 transition-all duration-300 group data-[state=on]:bg-gray-900/80 data-[state=off]:bg-slate-100/80",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative w-6 h-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sun$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sun$3e$__["Sun"], {
                        className: `absolute inset-0 transform transition-all duration-300 ${!isDark ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'} text-black`,
                        size: 24
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/ui/FlexTimeThemeToggle.tsx",
                        lineNumber: 52,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$moon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Moon$3e$__["Moon"], {
                        className: `absolute inset-0 transform transition-all duration-300 ${isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'} text-[color:var(--ft-neon)]`,
                        size: 24
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/ui/FlexTimeThemeToggle.tsx",
                        lineNumber: 60,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/ui/FlexTimeThemeToggle.tsx",
                lineNumber: 51,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${!isDark ? 'bg-black/10 shadow-black/20' : 'bg-[color:var(--ft-neon)]/20 shadow-[color:var(--ft-neon)]/20'} shadow-lg`
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/FlexTimeThemeToggle.tsx",
                lineNumber: 71,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/ui/FlexTimeThemeToggle.tsx",
        lineNumber: 45,
        columnNumber: 5
    }, this);
}
_s(FlexTimeThemeToggle, "76OfTKswtlYfcyBWk5XLQJOYEek=");
_c = FlexTimeThemeToggle;
var _c;
__turbopack_context__.k.register(_c, "FlexTimeThemeToggle");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/frontend/app/components/Navbar.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>Navbar)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$FlexTimeShinyButton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/FlexTimeShinyButton.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$FTLogo$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/FTLogo.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$FlexTimeThemeToggle$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/FlexTimeThemeToggle.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
function Navbar() {
    _s();
    const [isScrolled, setIsScrolled] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isMenuOpen, setIsMenuOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    // Handle scroll effect for glassmorphic transparency
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Navbar.useEffect": ()=>{
            const handleScroll = {
                "Navbar.useEffect.handleScroll": ()=>{
                    setIsScrolled(window.scrollY > 10);
                }
            }["Navbar.useEffect.handleScroll"];
            window.addEventListener('scroll', handleScroll);
            return ({
                "Navbar.useEffect": ()=>window.removeEventListener('scroll', handleScroll)
            })["Navbar.useEffect"];
        }
    }["Navbar.useEffect"], []);
    // Menu items with corresponding routes
    const menuItems = [
        {
            label: 'Home',
            path: '/dashboard'
        },
        {
            label: 'FT Builder',
            path: '/schedule-builder'
        },
        {
            label: 'Big 12 Sports',
            path: '/sports'
        },
        {
            label: 'Analytics',
            path: '/analytics'
        }
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
        className: `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 dark:bg-black/80 backdrop-blur-md border-b border-gray-200/50 dark:border-cyan-900/30 shadow-[0_2px_20px_rgba(0,191,255,0.4)]' : 'bg-transparent shadow-[0_2px_15px_rgba(0,191,255,0.3)]'}`,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "max-w-[calc(100%-4rem)] mx-auto px-6 py-4",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            href: "/",
                            className: "flex items-center gap-2",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$FTLogo$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FTLogo"], {
                                        variant: "black",
                                        size: "sm",
                                        alt: "FlexTime Logo",
                                        showText: true,
                                        className: "flex items-center dark:hidden"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/components/Navbar.tsx",
                                        lineNumber: 47,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$FTLogo$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FTLogo"], {
                                        variant: "white",
                                        size: "sm",
                                        alt: "FlexTime Logo",
                                        showText: true,
                                        className: "hidden dark:flex items-center"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/components/Navbar.tsx",
                                        lineNumber: 54,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/app/components/Navbar.tsx",
                                lineNumber: 46,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/frontend/app/components/Navbar.tsx",
                            lineNumber: 45,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "hidden md:flex items-center space-x-8",
                            children: menuItems.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                    href: item.path,
                                    className: `transition-all ${pathname === item.path ? 'border-b-2 border-black dark:border-[color:var(--ft-neon)]' : ''}`,
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: `text-sm font-medium ${pathname === item.path ? 'bg-gradient-to-r from-black dark:from-white to-black dark:to-[color:var(--ft-neon)] bg-clip-text text-transparent' : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-black hover:to-gray-600 dark:hover:from-white dark:hover:to-[color:var(--ft-neon)] hover:bg-clip-text hover:text-transparent'}`,
                                        style: {
                                            fontFamily: 'var(--ft-font-secondary)'
                                        },
                                        children: item.label.toUpperCase()
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/components/Navbar.tsx",
                                        lineNumber: 76,
                                        columnNumber: 17
                                    }, this)
                                }, item.path, false, {
                                    fileName: "[project]/frontend/app/components/Navbar.tsx",
                                    lineNumber: 67,
                                    columnNumber: 15
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/frontend/app/components/Navbar.tsx",
                            lineNumber: 65,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "hidden md:flex items-center space-x-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$FlexTimeThemeToggle$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FlexTimeThemeToggle"], {}, void 0, false, {
                                    fileName: "[project]/frontend/app/components/Navbar.tsx",
                                    lineNumber: 85,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$FlexTimeShinyButton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FlexTimeShinyButton"], {
                                    variant: "secondary",
                                    className: "px-4 py-2 text-sm",
                                    children: "Settings"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/app/components/Navbar.tsx",
                                    lineNumber: 86,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$FlexTimeShinyButton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FlexTimeShinyButton"], {
                                    variant: "secondary",
                                    className: "px-4 py-2 text-sm",
                                    children: "Sign In"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/app/components/Navbar.tsx",
                                    lineNumber: 89,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/app/components/Navbar.tsx",
                            lineNumber: 84,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$FlexTimeShinyButton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FlexTimeShinyButton"], {
                            variant: "secondary",
                            className: "md:hidden p-2 !min-w-0 !min-h-0",
                            onClick: ()=>setIsMenuOpen(!isMenuOpen),
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                xmlns: "http://www.w3.org/2000/svg",
                                className: "h-6 w-6",
                                fill: "none",
                                viewBox: "0 0 24 24",
                                stroke: "currentColor",
                                children: isMenuOpen ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    strokeWidth: 2,
                                    d: "M6 18L18 6M6 6l12 12"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/app/components/Navbar.tsx",
                                    lineNumber: 108,
                                    columnNumber: 17
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    strokeWidth: 2,
                                    d: "M4 6h16M4 12h16M4 18h16"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/app/components/Navbar.tsx",
                                    lineNumber: 115,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/components/Navbar.tsx",
                                lineNumber: 100,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/frontend/app/components/Navbar.tsx",
                            lineNumber: 95,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/app/components/Navbar.tsx",
                    lineNumber: 43,
                    columnNumber: 9
                }, this),
                isMenuOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "md:hidden mt-4 pb-4 space-y-3 animate-fadeIn",
                    children: [
                        menuItems.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                href: item.path,
                                className: `block py-2 px-4 text-base font-medium rounded-md transition-all ${pathname === item.path ? 'bg-gray-200 dark:bg-black/40 text-black dark:text-[color:var(--ft-neon)] border-l-2 border-black dark:border-[color:var(--ft-neon)]' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-black/20'}`,
                                onClick: ()=>setIsMenuOpen(false),
                                children: item.label
                            }, item.path, false, {
                                fileName: "[project]/frontend/app/components/Navbar.tsx",
                                lineNumber: 130,
                                columnNumber: 15
                            }, this)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "pt-4 flex flex-col space-y-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$FlexTimeShinyButton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FlexTimeShinyButton"], {
                                    variant: "secondary",
                                    className: "py-2 text-sm",
                                    children: "Settings"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/app/components/Navbar.tsx",
                                    lineNumber: 144,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$FlexTimeShinyButton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FlexTimeShinyButton"], {
                                    variant: "secondary",
                                    className: "py-2 text-sm",
                                    children: "Sign In"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/app/components/Navbar.tsx",
                                    lineNumber: 147,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/app/components/Navbar.tsx",
                            lineNumber: 143,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/app/components/Navbar.tsx",
                    lineNumber: 128,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/app/components/Navbar.tsx",
            lineNumber: 42,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/app/components/Navbar.tsx",
        lineNumber: 35,
        columnNumber: 5
    }, this);
}
_s(Navbar, "mBRND/PSAfDD/kdL5OD2Qx5FiU0=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"]
    ];
});
_c = Navbar;
var _c;
__turbopack_context__.k.register(_c, "Navbar");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/frontend/src/components/ui/FlexTimeAnimatedBackground.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "FlexTimeAnimatedBackground": (()=>FlexTimeAnimatedBackground)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
function FlexTimeAnimatedBackground({ className = '', intensity = 'medium', showGrid = true, showFloatingElements = true }) {
    _s();
    const [mouseGradientStyle, setMouseGradientStyle] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        left: '0px',
        top: '0px',
        opacity: 0
    });
    const [ripples, setRipples] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "FlexTimeAnimatedBackground.useEffect": ()=>{
            const handleMouseMove = {
                "FlexTimeAnimatedBackground.useEffect.handleMouseMove": (e)=>{
                    setMouseGradientStyle({
                        left: `${e.clientX}px`,
                        top: `${e.clientY}px`,
                        opacity: intensity === 'high' ? 0.8 : intensity === 'medium' ? 0.5 : 0.3
                    });
                }
            }["FlexTimeAnimatedBackground.useEffect.handleMouseMove"];
            const handleMouseLeave = {
                "FlexTimeAnimatedBackground.useEffect.handleMouseLeave": ()=>{
                    setMouseGradientStyle({
                        "FlexTimeAnimatedBackground.useEffect.handleMouseLeave": (prev)=>({
                                ...prev,
                                opacity: 0
                            })
                    }["FlexTimeAnimatedBackground.useEffect.handleMouseLeave"]);
                }
            }["FlexTimeAnimatedBackground.useEffect.handleMouseLeave"];
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseleave', handleMouseLeave);
            return ({
                "FlexTimeAnimatedBackground.useEffect": ()=>{
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseleave', handleMouseLeave);
                }
            })["FlexTimeAnimatedBackground.useEffect"];
        }
    }["FlexTimeAnimatedBackground.useEffect"], [
        intensity
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "FlexTimeAnimatedBackground.useEffect": ()=>{
            const handleClick = {
                "FlexTimeAnimatedBackground.useEffect.handleClick": (e)=>{
                    const newRipple = {
                        id: Date.now(),
                        x: e.clientX,
                        y: e.clientY
                    };
                    setRipples({
                        "FlexTimeAnimatedBackground.useEffect.handleClick": (prev)=>[
                                ...prev,
                                newRipple
                            ]
                    }["FlexTimeAnimatedBackground.useEffect.handleClick"]);
                    setTimeout({
                        "FlexTimeAnimatedBackground.useEffect.handleClick": ()=>setRipples({
                                "FlexTimeAnimatedBackground.useEffect.handleClick": (prev)=>prev.filter({
                                        "FlexTimeAnimatedBackground.useEffect.handleClick": (r)=>r.id !== newRipple.id
                                    }["FlexTimeAnimatedBackground.useEffect.handleClick"])
                            }["FlexTimeAnimatedBackground.useEffect.handleClick"])
                    }["FlexTimeAnimatedBackground.useEffect.handleClick"], 1000);
                }
            }["FlexTimeAnimatedBackground.useEffect.handleClick"];
            document.addEventListener('click', handleClick);
            return ({
                "FlexTimeAnimatedBackground.useEffect": ()=>document.removeEventListener('click', handleClick)
            })["FlexTimeAnimatedBackground.useEffect"];
        }
    }["FlexTimeAnimatedBackground.useEffect"], []);
    const backgroundStyles = `
    .ft-mouse-gradient {
      position: fixed;
      pointer-events: none;
      border-radius: 9999px;
      background-image: radial-gradient(circle, rgba(0, 191, 255, 0.03), rgba(30, 64, 175, 0.02), transparent 70%);
      transform: translate(-50%, -50%);
      will-change: left, top, opacity;
      transition: left 70ms linear, top 70ms linear, opacity 300ms ease-out;
      z-index: 1;
    }
    
    .dark .ft-mouse-gradient {
      background-image: radial-gradient(circle, rgba(0, 191, 255, 0.03), rgba(30, 64, 175, 0.02), transparent 70%);
    }
    
    .light .ft-mouse-gradient, html:not(.dark) .ft-mouse-gradient {
      background-image: radial-gradient(circle, rgba(0, 191, 255, 0.05), rgba(30, 64, 175, 0.03), transparent 70%);
    }
    
    @keyframes ft-grid-draw { 
      0% { stroke-dashoffset: 1000; opacity: 0; } 
      50% { opacity: 0.4; } 
      100% { stroke-dashoffset: 0; opacity: 0.2; } 
    }
    
    @keyframes ft-pulse-glow { 
      0%, 100% { opacity: 0.05; transform: scale(1); } 
      50% { opacity: 0.15; transform: scale(1.05); } 
    }
    
    @keyframes ft-float { 
      0%, 100% { transform: translateY(0) translateX(0); opacity: 0.1; } 
      25% { transform: translateY(-8px) translateX(3px); opacity: 0.3; } 
      50% { transform: translateY(-4px) translateX(-2px); opacity: 0.2; } 
      75% { transform: translateY(-12px) translateX(5px); opacity: 0.4; } 
    }
    
    .ft-grid-line { 
      stroke: rgba(0, 191, 255, 0.15); 
      stroke-width: 0.8; 
      opacity: 0; 
      stroke-dasharray: 5 5; 
      stroke-dashoffset: 1000; 
      animation: ft-grid-draw 3s ease-out forwards; 
    }
    
    .dark .ft-grid-line {
      stroke: rgba(0, 191, 255, 0.15);
    }
    
    .light .ft-grid-line, html:not(.dark) .ft-grid-line {
      stroke: rgba(0, 191, 255, 0.25);
    }
    
    .ft-grid-pattern {
      stroke: rgba(0, 191, 255, 0.08);
    }
    
    .dark .ft-grid-pattern {
      stroke: rgba(0, 191, 255, 0.08);
    }
    
    .light .ft-grid-pattern, html:not(.dark) .ft-grid-pattern {
      stroke: rgba(0, 191, 255, 0.15);
    }
    
    .ft-detail-dot { 
      fill: rgba(0, 191, 255, 0.1); 
      opacity: 0; 
      animation: ft-pulse-glow 4s ease-in-out infinite; 
    }
    
    .ft-floating-element { 
      position: absolute; 
      width: 1px; 
      height: 1px; 
      background: rgba(0, 191, 255, 0.2); 
      border-radius: 50%; 
      opacity: 0; 
      animation: ft-float 6s ease-in-out infinite; 
    }
    
    .ft-ripple-effect { 
      position: fixed; 
      width: 3px; 
      height: 3px; 
      background: rgba(0, 191, 255, 0.3); 
      border-radius: 50%; 
      transform: translate(-50%, -50%); 
      pointer-events: none; 
      animation: ft-pulse-glow 1s ease-out forwards; 
      z-index: 9999; 
    }
    
    .ft-corner-element { 
      position: absolute; 
      width: 32px; 
      height: 32px; 
      border: 1px solid rgba(0, 191, 255, 0.1); 
      opacity: 0; 
      animation: ft-pulse-glow 1s ease-out forwards; 
    }
  `;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("style", {
                children: backgroundStyles
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/FlexTimeAnimatedBackground.tsx",
                lineNumber: 165,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `absolute inset-0 overflow-hidden ${className}`,
                children: [
                    showGrid && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                        className: "absolute inset-0 w-full h-full pointer-events-none",
                        xmlns: "http://www.w3.org/2000/svg",
                        "aria-hidden": "true",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("defs", {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pattern", {
                                    id: "ftGridPattern",
                                    width: "60",
                                    height: "60",
                                    patternUnits: "userSpaceOnUse",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                        d: "M 60 0 L 0 0 0 60",
                                        fill: "none",
                                        stroke: "rgba(0, 191, 255, 0.08)",
                                        strokeWidth: "0.8",
                                        className: "ft-grid-pattern"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/ui/FlexTimeAnimatedBackground.tsx",
                                        lineNumber: 177,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/ui/FlexTimeAnimatedBackground.tsx",
                                    lineNumber: 176,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/ui/FlexTimeAnimatedBackground.tsx",
                                lineNumber: 175,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                                width: "100%",
                                height: "100%",
                                fill: "url(#ftGridPattern)"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/ui/FlexTimeAnimatedBackground.tsx",
                                lineNumber: 186,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                x1: "0",
                                y1: "25%",
                                x2: "100%",
                                y2: "25%",
                                className: "ft-grid-line",
                                style: {
                                    animationDelay: '0.5s'
                                }
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/ui/FlexTimeAnimatedBackground.tsx",
                                lineNumber: 189,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                x1: "0",
                                y1: "75%",
                                x2: "100%",
                                y2: "75%",
                                className: "ft-grid-line",
                                style: {
                                    animationDelay: '1s'
                                }
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/ui/FlexTimeAnimatedBackground.tsx",
                                lineNumber: 190,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                x1: "25%",
                                y1: "0",
                                x2: "25%",
                                y2: "100%",
                                className: "ft-grid-line",
                                style: {
                                    animationDelay: '1.5s'
                                }
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/ui/FlexTimeAnimatedBackground.tsx",
                                lineNumber: 191,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                x1: "75%",
                                y1: "0",
                                x2: "75%",
                                y2: "100%",
                                className: "ft-grid-line",
                                style: {
                                    animationDelay: '2s'
                                }
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/ui/FlexTimeAnimatedBackground.tsx",
                                lineNumber: 192,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                x1: "50%",
                                y1: "0",
                                x2: "50%",
                                y2: "100%",
                                className: "ft-grid-line",
                                style: {
                                    animationDelay: '2.5s',
                                    opacity: '0.03'
                                }
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/ui/FlexTimeAnimatedBackground.tsx",
                                lineNumber: 195,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                x1: "0",
                                y1: "50%",
                                x2: "100%",
                                y2: "50%",
                                className: "ft-grid-line",
                                style: {
                                    animationDelay: '3s',
                                    opacity: '0.03'
                                }
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/ui/FlexTimeAnimatedBackground.tsx",
                                lineNumber: 196,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                cx: "25%",
                                cy: "25%",
                                r: "1.5",
                                className: "ft-detail-dot",
                                style: {
                                    animationDelay: '3s'
                                }
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/ui/FlexTimeAnimatedBackground.tsx",
                                lineNumber: 199,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                cx: "75%",
                                cy: "25%",
                                r: "1.5",
                                className: "ft-detail-dot",
                                style: {
                                    animationDelay: '3.2s'
                                }
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/ui/FlexTimeAnimatedBackground.tsx",
                                lineNumber: 200,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                cx: "25%",
                                cy: "75%",
                                r: "1.5",
                                className: "ft-detail-dot",
                                style: {
                                    animationDelay: '3.4s'
                                }
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/ui/FlexTimeAnimatedBackground.tsx",
                                lineNumber: 201,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                cx: "75%",
                                cy: "75%",
                                r: "1.5",
                                className: "ft-detail-dot",
                                style: {
                                    animationDelay: '3.6s'
                                }
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/ui/FlexTimeAnimatedBackground.tsx",
                                lineNumber: 202,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                cx: "50%",
                                cy: "50%",
                                r: "1",
                                className: "ft-detail-dot",
                                style: {
                                    animationDelay: '4s'
                                }
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/ui/FlexTimeAnimatedBackground.tsx",
                                lineNumber: 203,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/ui/FlexTimeAnimatedBackground.tsx",
                        lineNumber: 170,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "ft-corner-element top-4 left-4",
                        style: {
                            animationDelay: '4s'
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "absolute top-0 left-0 w-1.5 h-1.5 bg-[color:var(--ft-neon)] opacity-20 rounded-full"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/ui/FlexTimeAnimatedBackground.tsx",
                            lineNumber: 209,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/ui/FlexTimeAnimatedBackground.tsx",
                        lineNumber: 208,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "ft-corner-element top-4 right-4",
                        style: {
                            animationDelay: '4.2s'
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "absolute top-0 right-0 w-1.5 h-1.5 bg-[color:var(--ft-neon)] opacity-20 rounded-full"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/ui/FlexTimeAnimatedBackground.tsx",
                            lineNumber: 212,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/ui/FlexTimeAnimatedBackground.tsx",
                        lineNumber: 211,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "ft-corner-element bottom-4 left-4",
                        style: {
                            animationDelay: '4.4s'
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "absolute bottom-0 left-0 w-1.5 h-1.5 bg-[color:var(--ft-neon)] opacity-20 rounded-full"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/ui/FlexTimeAnimatedBackground.tsx",
                            lineNumber: 215,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/ui/FlexTimeAnimatedBackground.tsx",
                        lineNumber: 214,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "ft-corner-element bottom-4 right-4",
                        style: {
                            animationDelay: '4.6s'
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "absolute bottom-0 right-0 w-1.5 h-1.5 bg-[color:var(--ft-neon)] opacity-20 rounded-full"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/ui/FlexTimeAnimatedBackground.tsx",
                            lineNumber: 218,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/ui/FlexTimeAnimatedBackground.tsx",
                        lineNumber: 217,
                        columnNumber: 9
                    }, this),
                    showFloatingElements && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "ft-floating-element",
                                style: {
                                    top: '20%',
                                    left: '10%',
                                    animationDelay: '0.5s'
                                }
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/ui/FlexTimeAnimatedBackground.tsx",
                                lineNumber: 224,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "ft-floating-element",
                                style: {
                                    top: '60%',
                                    left: '85%',
                                    animationDelay: '1s'
                                }
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/ui/FlexTimeAnimatedBackground.tsx",
                                lineNumber: 225,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "ft-floating-element",
                                style: {
                                    top: '35%',
                                    left: '8%',
                                    animationDelay: '1.5s'
                                }
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/ui/FlexTimeAnimatedBackground.tsx",
                                lineNumber: 226,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "ft-floating-element",
                                style: {
                                    top: '80%',
                                    left: '90%',
                                    animationDelay: '2s'
                                }
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/ui/FlexTimeAnimatedBackground.tsx",
                                lineNumber: 227,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "ft-floating-element",
                                style: {
                                    top: '15%',
                                    left: '70%',
                                    animationDelay: '2.5s'
                                }
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/ui/FlexTimeAnimatedBackground.tsx",
                                lineNumber: 228,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "ft-floating-element",
                                style: {
                                    top: '45%',
                                    left: '15%',
                                    animationDelay: '3s'
                                }
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/ui/FlexTimeAnimatedBackground.tsx",
                                lineNumber: 229,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "ft-floating-element",
                                style: {
                                    top: '70%',
                                    left: '60%',
                                    animationDelay: '3.5s'
                                }
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/ui/FlexTimeAnimatedBackground.tsx",
                                lineNumber: 230,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "ft-floating-element",
                                style: {
                                    top: '25%',
                                    left: '40%',
                                    animationDelay: '4s'
                                }
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/ui/FlexTimeAnimatedBackground.tsx",
                                lineNumber: 231,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "ft-mouse-gradient w-96 h-96 blur-3xl",
                        style: {
                            left: mouseGradientStyle.left,
                            top: mouseGradientStyle.top,
                            opacity: mouseGradientStyle.opacity
                        }
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/ui/FlexTimeAnimatedBackground.tsx",
                        lineNumber: 236,
                        columnNumber: 9
                    }, this),
                    ripples.map((ripple)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "ft-ripple-effect",
                            style: {
                                left: `${ripple.x}px`,
                                top: `${ripple.y}px`
                            }
                        }, ripple.id, false, {
                            fileName: "[project]/frontend/src/components/ui/FlexTimeAnimatedBackground.tsx",
                            lineNumber: 247,
                            columnNumber: 11
                        }, this))
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/ui/FlexTimeAnimatedBackground.tsx",
                lineNumber: 166,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
_s(FlexTimeAnimatedBackground, "KB97eKuewrVH2cwk3uV0PBKteaA=");
_c = FlexTimeAnimatedBackground;
var _c;
__turbopack_context__.k.register(_c, "FlexTimeAnimatedBackground");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=frontend_a4eb51bb._.js.map