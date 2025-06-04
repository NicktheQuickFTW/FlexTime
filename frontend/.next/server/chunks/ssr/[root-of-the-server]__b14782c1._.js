module.exports = {

"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)": (function(__turbopack_context__) {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}}),
"[project]/frontend/lib/utils.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "cn": (()=>cn)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-ssr] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
}),
"[project]/frontend/src/components/ui/FlexTimeShinyButton.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "FlexTimeGlassButton": (()=>FlexTimeGlassButton),
    "FlexTimeNeonButton": (()=>FlexTimeNeonButton),
    "FlexTimePrimaryButton": (()=>FlexTimePrimaryButton),
    "FlexTimeSecondaryButton": (()=>FlexTimeSecondaryButton),
    "FlexTimeShinyButton": (()=>FlexTimeShinyButton),
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/utils.ts [app-ssr] (ecmascript)");
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
            base: "bg-[color:var(--ft-neon)] text-black border border-[color:var(--ft-neon)] hover:bg-[color:var(--ft-neon)]/80 shadow-lg hover:shadow-[color:var(--ft-neon-glow)]",
            shine: "var(--ft-neon)"
        },
        secondary: {
            base: "bg-transparent border border-gray-600 text-white hover:border-[color:var(--ft-neon)] hover:bg-[color:var(--ft-neon)]/10",
            shine: "var(--ft-neon)"
        },
        neon: {
            base: "bg-black border-2 border-[color:var(--ft-neon)] text-white hover:bg-[color:var(--ft-neon)]/10 shadow-xl shadow-[color:var(--ft-neon-glow)]",
            shine: "var(--ft-neon)"
        },
        glass: {
            base: "ft-glass-card text-white border border-[color:var(--ft-glass-border)] hover:border-[color:var(--ft-neon)]/50 backdrop-blur-xl",
            shine: "var(--ft-neon)"
        }
    };
    const currentVariant = variantStyles[variant];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].button, {
        ...animationProps,
        ...props,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("relative rounded-lg px-6 py-3 font-medium transition-all duration-300 ease-in-out ft-font-ui uppercase tracking-wide", currentVariant.base, className),
        style: {
            '--primary': 'var(--ft-neon)'
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
const FlexTimePrimaryButton = (props)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FlexTimeShinyButton, {
        variant: "primary",
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/FlexTimeShinyButton.tsx",
        lineNumber: 107,
        columnNumber: 3
    }, this);
const FlexTimeSecondaryButton = (props)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FlexTimeShinyButton, {
        variant: "secondary",
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/FlexTimeShinyButton.tsx",
        lineNumber: 111,
        columnNumber: 3
    }, this);
const FlexTimeNeonButton = (props)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FlexTimeShinyButton, {
        variant: "neon",
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/FlexTimeShinyButton.tsx",
        lineNumber: 115,
        columnNumber: 3
    }, this);
const FlexTimeGlassButton = (props)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FlexTimeShinyButton, {
        variant: "glass",
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/FlexTimeShinyButton.tsx",
        lineNumber: 119,
        columnNumber: 3
    }, this);
const __TURBOPACK__default__export__ = FlexTimeShinyButton;
}),
"[project]/frontend/src/components/ui/FTLogo.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "FTLogo": (()=>FTLogo),
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/image.js [app-ssr] (ecmascript)");
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
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
            showText && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "ft-logo-text font-ft-brand font-bold uppercase bg-gradient-to-r from-white to-[color:var(--ft-neon)] bg-clip-text text-transparent",
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
const __TURBOPACK__default__export__ = FTLogo;
}),
"[project]/frontend/components/ui/toggle.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "Toggle": (()=>Toggle),
    "toggleVariants": (()=>toggleVariants)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toggle$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-toggle/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/utils.ts [app-ssr] (ecmascript)");
;
;
;
;
;
const toggleVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cva"])("inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground", {
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
const Toggle = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])(({ className, variant, size, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toggle$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Root"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])(toggleVariants({
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
Toggle.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toggle$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Root"].displayName;
;
}),
"[project]/frontend/src/types/index.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

// Type definitions for the FlexTime Scheduling System UI
__turbopack_context__.s({
    "ConstraintCategory": (()=>ConstraintCategory),
    "ConstraintType": (()=>ConstraintType),
    "SportType": (()=>SportType)
});
var SportType = /*#__PURE__*/ function(SportType) {
    SportType["FOOTBALL"] = "Football";
    SportType["MENS_BASKETBALL"] = "Men's Basketball";
    SportType["WOMENS_BASKETBALL"] = "Women's Basketball";
    SportType["BASEBALL"] = "Baseball";
    SportType["SOFTBALL"] = "Softball";
    SportType["VOLLEYBALL"] = "Volleyball";
    SportType["SOCCER"] = "Soccer";
    SportType["MENS_TENNIS"] = "Men's Tennis";
    SportType["WOMENS_TENNIS"] = "Women's Tennis";
    SportType["GOLF"] = "Golf";
    SportType["SWIMMING"] = "Swimming";
    SportType["TRACK"] = "Track";
    SportType["CROSS_COUNTRY"] = "Cross Country";
    SportType["WRESTLING"] = "Wrestling";
    SportType["GYMNASTICS"] = "Gymnastics";
    return SportType;
}({});
var ConstraintType = /*#__PURE__*/ function(ConstraintType) {
    ConstraintType["REST_DAYS"] = "RestDays";
    ConstraintType["MAX_CONSECUTIVE_AWAY"] = "MaxConsecutiveAway";
    ConstraintType["MAX_CONSECUTIVE_HOME"] = "MaxConsecutiveHome";
    ConstraintType["VENUE_UNAVAILABILITY"] = "VenueUnavailability";
    ConstraintType["TEAM_UNAVAILABILITY"] = "TeamUnavailability";
    ConstraintType["REQUIRED_MATCHUP"] = "RequiredMatchup";
    ConstraintType["AVOID_BACK_TO_BACK"] = "AvoidBackToBack";
    return ConstraintType;
}({});
var ConstraintCategory = /*#__PURE__*/ function(ConstraintCategory) {
    ConstraintCategory["TEAM"] = "Team";
    ConstraintCategory["VENUE"] = "Venue";
    ConstraintCategory["SCHEDULE"] = "Schedule";
    return ConstraintCategory;
}({});
}),
"[project]/frontend/src/theme/extendedTheme.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "createExtendedTheme": (()=>createExtendedTheme),
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$styles$2f$createTheme$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__createTheme$3e$__ = __turbopack_context__.i("[project]/node_modules/@mui/material/esm/styles/createTheme.js [app-ssr] (ecmascript) <export default as createTheme>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/types/index.ts [app-ssr] (ecmascript)");
;
;
// Sport-specific color palettes
const sportColorMap = {
    [__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SportType"].FOOTBALL]: {
        main: '#8C1D40',
        light: '#B33D5E',
        dark: '#5E1429'
    },
    [__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SportType"].MENS_BASKETBALL]: {
        main: '#00A3E0',
        light: '#33B5E7',
        dark: '#0076A3'
    },
    [__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SportType"].WOMENS_BASKETBALL]: {
        main: '#00A3E0',
        light: '#33B5E7',
        dark: '#0076A3'
    },
    [__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SportType"].BASEBALL]: {
        main: '#FFC627',
        light: '#FFD45F',
        dark: '#D9A61E'
    },
    [__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SportType"].SOFTBALL]: {
        main: '#FFC627',
        light: '#FFD45F',
        dark: '#D9A61E'
    },
    [__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SportType"].VOLLEYBALL]: {
        main: '#00A3E0',
        light: '#33B5E7',
        dark: '#0076A3'
    },
    [__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SportType"].SOCCER]: {
        main: '#00A3E0',
        light: '#33B5E7',
        dark: '#0076A3'
    },
    [__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SportType"].MENS_TENNIS]: {
        main: '#FFC627',
        light: '#FFD45F',
        dark: '#D9A61E'
    },
    [__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SportType"].WOMENS_TENNIS]: {
        main: '#FFC627',
        light: '#FFD45F',
        dark: '#D9A61E'
    },
    [__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SportType"].GOLF]: {
        main: '#FFC627',
        light: '#FFD45F',
        dark: '#D9A61E'
    },
    [__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SportType"].SWIMMING]: {
        main: '#00A3E0',
        light: '#33B5E7',
        dark: '#0076A3'
    },
    [__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SportType"].TRACK]: {
        main: '#8C1D40',
        light: '#B33D5E',
        dark: '#5E1429'
    },
    [__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SportType"].CROSS_COUNTRY]: {
        main: '#8C1D40',
        light: '#B33D5E',
        dark: '#5E1429'
    },
    [__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SportType"].WRESTLING]: {
        main: '#8C1D40',
        light: '#B33D5E',
        dark: '#5E1429'
    },
    [__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SportType"].GYMNASTICS]: {
        main: '#00A3E0',
        light: '#33B5E7',
        dark: '#0076A3'
    }
};
const createExtendedTheme = (mode = 'light', sportType = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SportType"].FOOTBALL)=>{
    // Get sport-specific colors
    const sportColors = sportColorMap[sportType] || sportColorMap[__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SportType"].FOOTBALL];
    // Determine text contrast color based on mode
    const contrastText = mode === 'light' ? '#ffffff' : '#000000';
    // Create the palette options based on mode and sport
    const paletteOptions = {
        mode,
        // Clean monochrome base palette
        primary: {
            main: mode === 'light' ? '#000000' : '#ffffff',
            light: mode === 'light' ? '#333333' : '#f5f5f5',
            dark: mode === 'light' ? '#000000' : '#cccccc',
            contrastText: mode === 'light' ? '#ffffff' : '#000000'
        },
        secondary: {
            main: mode === 'light' ? '#666666' : '#999999',
            light: mode === 'light' ? '#888888' : '#bbbbbb',
            dark: mode === 'light' ? '#444444' : '#777777',
            contrastText: mode === 'light' ? '#ffffff' : '#000000'
        },
        // Sport-specific accent color (keep for branding)
        sportAccent: {
            main: sportColors.main,
            light: sportColors.light,
            dark: sportColors.dark,
            contrastText
        },
        // Clean monochrome gradient
        gradient: mode === 'light' ? 'linear-gradient(135deg, #000000, #333333)' : 'linear-gradient(135deg, #ffffff, #f5f5f5)',
        // Clean monochrome backgrounds
        background: {
            default: mode === 'light' ? '#ffffff' : '#000000',
            paper: mode === 'light' ? '#ffffff' : '#000000',
            card: mode === 'light' ? '#ffffff' : '#000000'
        },
        text: {
            primary: mode === 'light' ? '#000000' : '#ffffff',
            secondary: mode === 'light' ? '#666666' : '#999999'
        }
    };
    // Create the theme with CSS variables enabled
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$styles$2f$createTheme$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__createTheme$3e$__["createTheme"])({
        cssVariables: true,
        palette: paletteOptions,
        typography: {
            // FT Brand Typography System
            fontFamily: '"Exo 2", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
            h1: {
                fontFamily: '"Orbitron", monospace',
                fontWeight: 800,
                letterSpacing: '-0.025em'
            },
            h2: {
                fontFamily: '"Orbitron", monospace',
                fontWeight: 700,
                letterSpacing: '-0.02em'
            },
            h3: {
                fontFamily: '"Rajdhani", sans-serif',
                fontWeight: 700,
                letterSpacing: '0.025em'
            },
            h4: {
                fontFamily: '"Rajdhani", sans-serif',
                fontWeight: 600,
                letterSpacing: '0.025em'
            },
            h5: {
                fontFamily: '"Rajdhani", sans-serif',
                fontWeight: 600,
                letterSpacing: '0.025em'
            },
            h6: {
                fontFamily: '"Rajdhani", sans-serif',
                fontWeight: 600,
                letterSpacing: '0.025em'
            },
            body1: {
                fontFamily: '"Exo 2", sans-serif',
                fontWeight: 400,
                letterSpacing: '0.015em'
            },
            body2: {
                fontFamily: '"Exo 2", sans-serif',
                fontWeight: 400,
                letterSpacing: '0.015em'
            },
            subtitle1: {
                fontFamily: '"Rajdhani", sans-serif',
                fontWeight: 500,
                letterSpacing: '0.025em'
            },
            subtitle2: {
                fontFamily: '"Rajdhani", sans-serif',
                fontWeight: 500,
                letterSpacing: '0.025em'
            },
            button: {
                fontFamily: '"Rajdhani", sans-serif',
                fontWeight: 600,
                letterSpacing: '0.025em',
                textTransform: 'none'
            },
            caption: {
                fontFamily: '"Exo 2", sans-serif',
                fontWeight: 400,
                letterSpacing: '0.015em'
            },
            overline: {
                fontFamily: '"Rajdhani", sans-serif',
                fontWeight: 500,
                letterSpacing: '0.1em',
                textTransform: 'uppercase'
            }
        },
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        textTransform: 'none',
                        borderRadius: 8,
                        padding: '12px 24px',
                        fontWeight: 500,
                        fontSize: '14px',
                        transition: 'all 0.2s ease',
                        border: `1px solid ${mode === 'light' ? '#e5e5e5' : '#333333'}`,
                        '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: mode === 'light' ? '0 4px 12px rgba(0, 0, 0, 0.08)' : '0 4px 12px rgba(255, 255, 255, 0.08)'
                        }
                    },
                    containedPrimary: {
                        background: mode === 'light' ? '#000000' : '#ffffff',
                        color: mode === 'light' ? '#ffffff' : '#000000',
                        border: 'none',
                        '&:hover': {
                            background: mode === 'light' ? '#333333' : '#e5e5e5'
                        }
                    },
                    outlined: {
                        borderColor: mode === 'light' ? '#000000' : '#ffffff',
                        color: mode === 'light' ? '#000000' : '#ffffff',
                        '&:hover': {
                            background: mode === 'light' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.04)',
                            borderColor: mode === 'light' ? '#000000' : '#ffffff'
                        }
                    },
                    text: {
                        color: mode === 'light' ? '#000000' : '#ffffff',
                        '&:hover': {
                            background: mode === 'light' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.04)'
                        }
                    }
                },
                variants: [
                    {
                        props: {
                            variant: 'contained',
                            color: 'sportAccent'
                        },
                        style: ({ theme })=>({
                                background: theme.vars ? `linear-gradient(135deg, var(--mui-palette-sportAccent-main), var(--mui-palette-sportAccent-light))` : `linear-gradient(135deg, ${theme.palette.sportAccent.main}, ${theme.palette.sportAccent.light})`,
                                color: theme.palette.sportAccent.contrastText
                            })
                    },
                    {
                        props: {
                            color: 'sportAccent'
                        },
                        style: ({ theme })=>({
                                color: theme.palette.sportAccent.main,
                                borderColor: theme.palette.sportAccent.main,
                                '&:hover': {
                                    backgroundColor: `${theme.palette.sportAccent.main}14`,
                                    borderColor: theme.palette.sportAccent.main
                                }
                            })
                    }
                ]
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: 12,
                        border: `1px solid ${mode === 'light' ? '#e5e5e5' : '#333333'}`,
                        boxShadow: 'none',
                        background: mode === 'light' ? '#ffffff' : '#000000',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: mode === 'light' ? '0 8px 16px rgba(0, 0, 0, 0.08)' : '0 8px 16px rgba(255, 255, 255, 0.08)',
                            borderColor: mode === 'light' ? '#cccccc' : '#555555'
                        }
                    }
                }
            },
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        boxShadow: 'none',
                        borderBottom: `1px solid ${mode === 'light' ? '#e5e5e5' : '#333333'}`,
                        backgroundColor: mode === 'light' ? '#ffffff' : '#000000'
                    }
                }
            },
            // Add input and form field styling
            MuiTextField: {
                styleOverrides: {
                    root: {
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 8,
                            fontSize: '14px',
                            '& fieldset': {
                                borderColor: mode === 'light' ? '#e5e5e5' : '#333333'
                            },
                            '&:hover fieldset': {
                                borderColor: mode === 'light' ? '#cccccc' : '#555555'
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: mode === 'light' ? '#000000' : '#ffffff',
                                borderWidth: 1
                            }
                        },
                        '& .MuiInputLabel-root': {
                            color: mode === 'light' ? '#666666' : '#999999',
                            fontSize: '14px',
                            '&.Mui-focused': {
                                color: mode === 'light' ? '#000000' : '#ffffff'
                            }
                        }
                    }
                }
            },
            MuiDialog: {
                styleOverrides: {
                    paper: {
                        borderRadius: 12,
                        border: `1px solid ${mode === 'light' ? '#e5e5e5' : '#333333'}`,
                        boxShadow: mode === 'light' ? '0 20px 40px rgba(0, 0, 0, 0.1)' : '0 20px 40px rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            MuiTable: {
                styleOverrides: {
                    root: {
                        '& .MuiTableCell-head': {
                            backgroundColor: mode === 'light' ? '#f8f9fa' : '#111111',
                            borderBottom: `1px solid ${mode === 'light' ? '#e5e5e5' : '#333333'}`,
                            fontWeight: 600,
                            fontSize: '13px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        },
                        '& .MuiTableCell-body': {
                            borderBottom: `1px solid ${mode === 'light' ? '#f0f0f0' : '#222222'}`,
                            fontSize: '14px'
                        }
                    }
                }
            }
        }
    });
};
const __TURBOPACK__default__export__ = createExtendedTheme;
}),
"[project]/frontend/src/config/sportConfig.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

// Sport-specific configuration for FlexTime UI
// Define sport-specific configuration interface
__turbopack_context__.s({
    "SportType": (()=>SportType),
    "doesSchoolSponsorSport": (()=>doesSchoolSponsorSport),
    "getSportConfig": (()=>getSportConfig),
    "getSportSponsors": (()=>getSportSponsors),
    "getSportTypeById": (()=>getSportTypeById),
    "hasRegularSeasonScheduling": (()=>hasRegularSeasonScheduling),
    "sportSponsorship": (()=>sportSponsorship),
    "sportsWithRegularSeason": (()=>sportsWithRegularSeason)
});
var SportType = /*#__PURE__*/ function(SportType) {
    SportType["FOOTBALL"] = "football";
    SportType["MENS_BASKETBALL"] = "mens_basketball";
    SportType["WOMENS_BASKETBALL"] = "womens_basketball";
    SportType["BASEBALL"] = "baseball";
    SportType["SOFTBALL"] = "softball";
    SportType["VOLLEYBALL"] = "volleyball";
    SportType["SOCCER"] = "soccer";
    SportType["MENS_TENNIS"] = "mens_tennis";
    SportType["WOMENS_TENNIS"] = "womens_tennis";
    SportType["GYMNASTICS"] = "gymnastics";
    SportType["WRESTLING"] = "wrestling";
    SportType["MENS_GOLF"] = "mens_golf";
    SportType["WOMENS_GOLF"] = "womens_golf";
    SportType["MENS_SWIMMING"] = "mens_swimming";
    SportType["WOMENS_SWIMMING"] = "womens_swimming";
    SportType["MENS_INDOOR_TRACK"] = "mens_indoor_track";
    SportType["WOMENS_INDOOR_TRACK"] = "womens_indoor_track";
    SportType["MENS_OUTDOOR_TRACK"] = "mens_outdoor_track";
    SportType["WOMENS_OUTDOOR_TRACK"] = "womens_outdoor_track";
    SportType["MENS_CROSS_COUNTRY"] = "mens_cross_country";
    SportType["WOMENS_CROSS_COUNTRY"] = "womens_cross_country";
    SportType["BEACH_VOLLEYBALL"] = "beach_volleyball";
    SportType["LACROSSE"] = "lacrosse";
    SportType["ROWING"] = "rowing";
    SportType["EQUESTRIAN"] = "equestrian";
    return SportType;
}({});
const sportSponsorship = {
    ["football"]: [
        'Arizona',
        'Arizona State',
        'Baylor',
        'BYU',
        'Cincinnati',
        'Colorado',
        'Houston',
        'Iowa State',
        'Kansas',
        'Kansas State',
        'Oklahoma State',
        'TCU',
        'Texas Tech',
        'UCF',
        'Utah',
        'West Virginia'
    ],
    ["mens_basketball"]: [
        'Arizona',
        'Arizona State',
        'Baylor',
        'BYU',
        'Cincinnati',
        'Colorado',
        'Houston',
        'Iowa State',
        'Kansas',
        'Kansas State',
        'Oklahoma State',
        'TCU',
        'Texas Tech',
        'UCF',
        'Utah',
        'West Virginia'
    ],
    ["womens_basketball"]: [
        'Arizona',
        'Arizona State',
        'Baylor',
        'BYU',
        'Cincinnati',
        'Colorado',
        'Houston',
        'Iowa State',
        'Kansas',
        'Kansas State',
        'Oklahoma State',
        'TCU',
        'Texas Tech',
        'UCF',
        'Utah',
        'West Virginia'
    ],
    ["baseball"]: [
        'Arizona',
        'Arizona State',
        'Baylor',
        'BYU',
        'Cincinnati',
        'Houston',
        'Kansas',
        'Kansas State',
        'Oklahoma State',
        'TCU',
        'Texas Tech',
        'UCF',
        'Utah',
        'West Virginia'
    ],
    ["softball"]: [
        'Arizona',
        'Arizona State',
        'Baylor',
        'BYU',
        'Houston',
        'Iowa State',
        'Kansas',
        'Oklahoma State',
        'Texas Tech',
        'UCF',
        'Utah'
    ],
    ["volleyball"]: [
        'Arizona',
        'Arizona State',
        'Baylor',
        'BYU',
        'Cincinnati',
        'Colorado',
        'Houston',
        'Iowa State',
        'Kansas',
        'Kansas State',
        'TCU',
        'Texas Tech',
        'UCF',
        'Utah',
        'West Virginia'
    ],
    ["soccer"]: [
        'Arizona',
        'Arizona State',
        'Baylor',
        'BYU',
        'Cincinnati',
        'Colorado',
        'Houston',
        'Iowa State',
        'Kansas',
        'Kansas State',
        'Oklahoma State',
        'TCU',
        'Texas Tech',
        'UCF',
        'Utah',
        'West Virginia'
    ],
    ["mens_tennis"]: [
        'Arizona',
        'Arizona State',
        'Baylor',
        'BYU',
        'Oklahoma State',
        'TCU',
        'Texas Tech',
        'UCF',
        'Utah'
    ],
    ["womens_tennis"]: [
        'Arizona',
        'Arizona State',
        'Baylor',
        'BYU',
        'Cincinnati',
        'Colorado',
        'Houston',
        'Iowa State',
        'Kansas',
        'Kansas State',
        'Oklahoma State',
        'TCU',
        'Texas Tech',
        'UCF',
        'Utah',
        'West Virginia'
    ],
    ["gymnastics"]: [
        'Arizona',
        'Arizona State',
        'BYU',
        'Iowa State',
        'Utah',
        'West Virginia',
        'Denver'
    ],
    ["wrestling"]: [
        'Arizona State',
        'Iowa State',
        'Oklahoma State',
        'West Virginia',
        'Air Force',
        'Cal Baptist',
        'Missouri',
        'North Dakota State',
        'Northern Colorado',
        'Northern Iowa',
        'Oklahoma',
        'South Dakota State',
        'Utah Valley',
        'Wyoming'
    ],
    ["mens_golf"]: [
        'Arizona',
        'Arizona State',
        'Baylor',
        'BYU',
        'Cincinnati',
        'Colorado',
        'Houston',
        'Iowa State',
        'Kansas',
        'Kansas State',
        'Oklahoma State',
        'TCU',
        'Texas Tech',
        'UCF',
        'Utah',
        'West Virginia'
    ],
    ["womens_golf"]: [
        'Arizona',
        'Arizona State',
        'Baylor',
        'BYU',
        'Cincinnati',
        'Colorado',
        'Houston',
        'Iowa State',
        'Kansas',
        'Kansas State',
        'Oklahoma State',
        'TCU',
        'Texas Tech',
        'UCF'
    ],
    ["mens_swimming"]: [
        'Arizona',
        'Arizona State',
        'BYU',
        'Cincinnati',
        'TCU',
        'Utah',
        'West Virginia'
    ],
    ["womens_swimming"]: [
        'Arizona',
        'Arizona State',
        'BYU',
        'Cincinnati',
        'Houston',
        'Iowa State',
        'Kansas',
        'TCU',
        'Utah',
        'West Virginia'
    ],
    ["mens_indoor_track"]: [
        'Arizona',
        'Arizona State',
        'Baylor',
        'BYU',
        'Cincinnati',
        'Colorado',
        'Houston',
        'Iowa State',
        'Kansas',
        'Kansas State',
        'Oklahoma State',
        'TCU',
        'Texas Tech'
    ],
    ["womens_indoor_track"]: [
        'Arizona',
        'Arizona State',
        'Baylor',
        'BYU',
        'Cincinnati',
        'Colorado',
        'Houston',
        'Iowa State',
        'Kansas',
        'Kansas State',
        'Oklahoma State',
        'TCU',
        'Texas Tech',
        'UCF',
        'Utah',
        'West Virginia'
    ],
    ["mens_outdoor_track"]: [
        'Arizona',
        'Arizona State',
        'Baylor',
        'BYU',
        'Cincinnati',
        'Colorado',
        'Houston',
        'Iowa State',
        'Kansas',
        'Kansas State',
        'Oklahoma State',
        'TCU',
        'Texas Tech'
    ],
    ["womens_outdoor_track"]: [
        'Arizona',
        'Arizona State',
        'Baylor',
        'BYU',
        'Cincinnati',
        'Colorado',
        'Houston',
        'Iowa State',
        'Kansas',
        'Kansas State',
        'Oklahoma State',
        'TCU',
        'Texas Tech',
        'UCF',
        'Utah',
        'West Virginia'
    ],
    ["mens_cross_country"]: [
        'Arizona',
        'Arizona State',
        'Baylor',
        'BYU',
        'Cincinnati',
        'Colorado',
        'Houston',
        'Iowa State',
        'Kansas',
        'Kansas State',
        'Oklahoma State',
        'TCU',
        'Texas Tech'
    ],
    ["womens_cross_country"]: [
        'Arizona',
        'Arizona State',
        'Baylor',
        'BYU',
        'Cincinnati',
        'Colorado',
        'Houston',
        'Iowa State',
        'Kansas',
        'Kansas State',
        'Oklahoma State',
        'TCU',
        'Texas Tech',
        'UCF',
        'Utah',
        'West Virginia'
    ],
    ["beach_volleyball"]: [
        'Arizona',
        'Arizona State',
        'TCU',
        'Utah'
    ],
    ["lacrosse"]: [
        'Arizona State',
        'Cincinnati',
        'Colorado',
        'Florida',
        'San Diego State',
        'UC Davis'
    ],
    ["rowing"]: [
        'Kansas',
        'Kansas State',
        'UCF',
        'West Virginia',
        'Old Dominion',
        'Tulsa'
    ],
    ["equestrian"]: [
        'Baylor',
        'Oklahoma State',
        'TCU',
        'Fresno'
    ]
};
const getSportSponsors = (sportType)=>{
    return sportSponsorship[sportType] || [];
};
const doesSchoolSponsorSport = (school, sportType)=>{
    return sportSponsorship[sportType]?.includes(school) || false;
};
const sportsWithRegularSeason = [
    "football",
    "mens_basketball",
    "womens_basketball",
    "baseball",
    "softball",
    "volleyball",
    "soccer",
    "mens_tennis",
    "womens_tennis",
    "gymnastics",
    "wrestling",
    "lacrosse"
];
const hasRegularSeasonScheduling = (sportType)=>{
    return sportsWithRegularSeason.includes(sportType);
};
// Define configurations for each sport
const sportConfigurations = {
    ["football"]: {
        name: 'Football',
        icon: 'sports_football',
        color: '#8C1D40',
        defaultGameDuration: 180,
        minRestDays: 5,
        recommendedRestDays: 7,
        typicalSeasonLength: 9,
        defaultGamesPerTeam: 9,
        maxGamesPerWeek: 1,
        allowDoubleHeaders: false,
        requireHomeAwayBalance: true,
        maxConsecutiveHomeGames: 3,
        maxConsecutiveAwayGames: 2,
        venueTypes: [
            'Stadium',
            'Field'
        ],
        requiresSpecializedVenues: true,
        calendarViewEnabled: true,
        matrixViewEnabled: true,
        bracketViewEnabled: false,
        regularSeasonScheduling: true,
        defaultConstraints: [
            {
                name: 'No More Than 2 Consecutive Road Games',
                description: 'No school plays more than two consecutive road Conference games',
                defaultPriority: 5,
                category: 'Core'
            },
            {
                name: 'No 4-of-5 Road Games',
                description: 'No school plays four-of-five Conference games on the road',
                defaultPriority: 5,
                category: 'Core'
            },
            {
                name: 'Limit Open Week Advantage',
                description: 'No school plays a Conference team coming off an open week more than twice',
                defaultPriority: 5,
                category: 'Core'
            },
            {
                name: 'No Double Back-to-Back Road Games',
                description: 'No school plays two sets of back-to-back Conference Road games in a season',
                defaultPriority: 5,
                category: 'Core'
            },
            {
                name: 'Thursday Game Recovery',
                description: 'Equal recovery period for teams playing in Thursday games',
                defaultPriority: 5,
                category: 'Core'
            },
            {
                name: 'Home Game Distribution',
                description: 'At least one of the first two games and one of the last two games as home games',
                defaultPriority: 4,
                category: 'Soft'
            },
            {
                name: 'Avoid 3 Weeks Without Home Game',
                description: 'Avoid institutions playing three straight weeks without a home game on campus',
                defaultPriority: 4,
                category: 'Soft'
            },
            {
                name: 'Avoid Away-Bye-Away',
                description: 'Avoid the away-bye-away scenario unless a Thursday appearance is involved',
                defaultPriority: 4,
                category: 'Soft'
            },
            {
                name: 'Time Zone Consideration',
                description: 'Consider crossing multiple time zones in game sequencing',
                defaultPriority: 3,
                category: 'Soft'
            },
            {
                name: 'Media Rights Obligations',
                description: 'Meet contractual obligations for ABC/ESPN and FOX telecasts',
                defaultPriority: 5,
                category: 'Media'
            }
        ],
        schedulingParameters: {
            conferenceFormat: 'Nine-Game Schedule',
            matchCount: 9,
            weekCount: 9,
            byeWeeks: 1,
            typicalMatchDays: [
                'Saturday'
            ],
            specialMatchDays: {
                'Weeknight': [
                    'Thursday'
                ]
            },
            seasonDates: {
                '2024-25': {
                    conferencePlayStart: '2024-09-14',
                    conferencePlayEnd: '2024-11-30',
                    championshipStart: '2024-12-07',
                    championshipEnd: '2024-12-07'
                },
                '2025-26': {
                    conferencePlayStart: '2025-09-13',
                    conferencePlayEnd: '2025-11-29',
                    championshipStart: '2025-12-06',
                    championshipEnd: '2025-12-06'
                }
            }
        }
    },
    ["mens_basketball"]: {
        name: 'Men\'s Basketball',
        icon: 'sports_basketball',
        color: '#FF9800',
        defaultGameDuration: 150,
        minRestDays: 2,
        recommendedRestDays: 3,
        typicalSeasonLength: 10,
        defaultGamesPerTeam: 18,
        maxGamesPerWeek: 2,
        allowDoubleHeaders: false,
        requireHomeAwayBalance: true,
        maxConsecutiveHomeGames: 3,
        maxConsecutiveAwayGames: 3,
        venueTypes: [
            'Arena'
        ],
        requiresSpecializedVenues: true,
        calendarViewEnabled: true,
        matrixViewEnabled: true,
        bracketViewEnabled: true,
        isOutdoorSport: false,
        hasIndoorBackup: false,
        regularSeasonScheduling: true,
        defaultConstraints: []
    }
};
const getSportTypeById = (sportId)=>{
    const sportTypes = Object.values(SportType);
    if (sportId < 1 || sportId > sportTypes.length) {
        throw new Error(`Invalid sport ID: ${sportId}`);
    }
    return sportTypes[sportId - 1];
};
const getSportConfig = (sportType)=>{
    return sportConfigurations[sportType] || {
        name: 'Unknown Sport',
        icon: 'sports',
        color: '#999999',
        defaultGameDuration: 120,
        minRestDays: 1,
        recommendedRestDays: 2,
        typicalSeasonLength: 8,
        defaultGamesPerTeam: 8,
        maxGamesPerWeek: 1,
        allowDoubleHeaders: false,
        requireHomeAwayBalance: true,
        maxConsecutiveHomeGames: 2,
        maxConsecutiveAwayGames: 2,
        venueTypes: [
            'Generic'
        ],
        requiresSpecializedVenues: false,
        calendarViewEnabled: true,
        matrixViewEnabled: true,
        bracketViewEnabled: false,
        defaultConstraints: []
    };
};
}),
"[project]/frontend/src/contexts/SportConfigContext.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "SportConfigProvider": (()=>SportConfigProvider),
    "default": (()=>__TURBOPACK__default__export__),
    "useSportConfigContext": (()=>useSportConfigContext)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/types/index.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$config$2f$sportConfig$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/config/sportConfig.ts [app-ssr] (ecmascript)");
;
;
;
;
// Create the context with a default value
const SportConfigContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])({
    currentSportId: null,
    currentSportType: null,
    sportConfig: null,
    setSportById: ()=>{},
    setSportByType: ()=>{},
    loading: false,
    error: null
});
const SportConfigProvider = ({ children, defaultSportId = 1 // Default to Football (ID: 1)
 })=>{
    const [currentSportId, setCurrentSportId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(defaultSportId);
    const [currentSportType, setCurrentSportType] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [sportConfig, setSportConfig] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    // Function to set sport by ID
    const setSportById = (sportId)=>{
        setCurrentSportId(sportId);
        try {
            const sportType = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$config$2f$sportConfig$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getSportTypeById"])(sportId);
            setCurrentSportType(sportType);
        } catch (err) {
            console.error('Error setting sport by ID:', err);
            setError('Invalid sport ID');
        }
    };
    // Function to set sport by type
    const setSportByType = (sportType)=>{
        setCurrentSportType(sportType);
        // Map SportType back to ID (reverse mapping)
        const sportTypeValues = Object.values(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SportType"]);
        const sportTypeIndex = sportTypeValues.indexOf(sportType);
        setCurrentSportId(sportTypeIndex + 1); // +1 because our IDs start at 1
    };
    // Update the sport config whenever the sport ID or type changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!currentSportId && !currentSportType) {
            return;
        }
        setLoading(true);
        try {
            // If we have a sport type, use it directly
            if (currentSportType) {
                const config = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$config$2f$sportConfig$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getSportConfig"])(currentSportType);
                setSportConfig(config);
            } else if (currentSportId) {
                const sportType = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$config$2f$sportConfig$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getSportTypeById"])(currentSportId);
                setCurrentSportType(sportType);
                const config = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$config$2f$sportConfig$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getSportConfig"])(sportType);
                setSportConfig(config);
            }
            setError(null);
        } catch (err) {
            console.error('Error loading sport configuration:', err);
            setError('Failed to load sport configuration');
            setSportConfig(null);
        } finally{
            setLoading(false);
        }
    }, [
        currentSportId,
        currentSportType
    ]);
    // Initialize with default sport
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (defaultSportId) {
            setSportById(defaultSportId);
        }
    }, [
        defaultSportId
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SportConfigContext.Provider, {
        value: {
            currentSportId,
            currentSportType,
            sportConfig,
            setSportById,
            setSportByType,
            loading,
            error
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/frontend/src/contexts/SportConfigContext.tsx",
        lineNumber: 103,
        columnNumber: 5
    }, this);
};
const useSportConfigContext = ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(SportConfigContext);
const __TURBOPACK__default__export__ = SportConfigContext;
}),
"[project]/frontend/src/contexts/ThemeContext.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "BIG12_TEAMS": (()=>BIG12_TEAMS),
    "ThemeProvider": (()=>ThemeProvider),
    "default": (()=>__TURBOPACK__default__export__),
    "useSportTeamTheme": (()=>useSportTeamTheme),
    "useThemeContext": (()=>useThemeContext),
    "useThemeCustomizations": (()=>useThemeCustomizations),
    "useThemeMode": (()=>useThemeMode)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$styles$2f$ThemeProvider$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ThemeProvider$3e$__ = __turbopack_context__.i("[project]/node_modules/@mui/material/esm/styles/ThemeProvider.js [app-ssr] (ecmascript) <export default as ThemeProvider>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$CssBaseline$2f$CssBaseline$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@mui/material/esm/CssBaseline/CssBaseline.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/types/index.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$theme$2f$extendedTheme$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/theme/extendedTheme.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$contexts$2f$SportConfigContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/contexts/SportConfigContext.tsx [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
// Big 12 teams mapping for team-specific theming
const BIG12_TEAMS = {
    'Arizona': {
        primary: '#CC0033',
        secondary: '#003366'
    },
    'Arizona State': {
        primary: '#8C1D40',
        secondary: '#FFC627'
    },
    'Baylor': {
        primary: '#003015',
        secondary: '#FFB81C'
    },
    'BYU': {
        primary: '#002E5D',
        secondary: '#FFFFFF'
    },
    'Cincinnati': {
        primary: '#E00122',
        secondary: '#000000'
    },
    'Colorado': {
        primary: '#CFB87C',
        secondary: '#000000'
    },
    'Houston': {
        primary: '#C8102E',
        secondary: '#FFFFFF'
    },
    'Iowa State': {
        primary: '#CC0033',
        secondary: '#FFC72C'
    },
    'Kansas': {
        primary: '#0051BA',
        secondary: '#E8000D'
    },
    'Kansas State': {
        primary: '#512888',
        secondary: '#FFFFFF'
    },
    'Oklahoma State': {
        primary: '#FF6600',
        secondary: '#000000'
    },
    'TCU': {
        primary: '#4D1979',
        secondary: '#A3A9AC'
    },
    'Texas Tech': {
        primary: '#CC0000',
        secondary: '#000000'
    },
    'UCF': {
        primary: '#FFC904',
        secondary: '#000000'
    },
    'Utah': {
        primary: '#CC0000',
        secondary: '#FFFFFF'
    },
    'West Virginia': {
        primary: '#002855',
        secondary: '#EAAA00'
    }
};
// Create the context with undefined as initial value
const ThemeContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
// Storage keys for theme persistence
const THEME_STORAGE_KEYS = {
    MODE: 'flextime-theme-mode',
    SPORT: 'flextime-theme-sport',
    TEAM: 'flextime-theme-team',
    CUSTOMIZATIONS: 'flextime-theme-customizations'
};
// Get initial theme from localStorage or system preference
const getInitialTheme = ()=>{
    if ("TURBOPACK compile-time truthy", 1) {
        return {
            mode: 'light'
        }; // Default for SSR
    }
    //TURBOPACK unreachable
    ;
};
// Save theme to localStorage
const saveThemeToStorage = (theme)=>{
    if ("TURBOPACK compile-time truthy", 1) return;
    //TURBOPACK unreachable
    ;
};
// Apply theme to document attributes for CSS variable access
const applyThemeToDocument = (theme)=>{
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    // Set mode attribute
    root.setAttribute('data-theme-mode', theme.mode);
    // Set sport attribute
    if (theme.sport) {
        root.setAttribute('data-theme-sport', theme.sport.toLowerCase().replace(/[\s']/g, '-'));
    } else {
        root.removeAttribute('data-theme-sport');
    }
    // Set team attribute
    if (theme.team) {
        root.setAttribute('data-theme-team', theme.team.toLowerCase().replace(/\s/g, '-'));
    } else {
        root.removeAttribute('data-theme-team');
    }
    // Apply customizations as CSS custom properties
    if (theme.customizations) {
        const customizations = theme.customizations;
        if (customizations.primaryColor) {
            root.style.setProperty('--flextime-primary', customizations.primaryColor);
        }
        if (customizations.secondaryColor) {
            root.style.setProperty('--flextime-secondary', customizations.secondaryColor);
        }
        if (customizations.accentColor) {
            root.style.setProperty('--flextime-accent', customizations.accentColor);
        }
        if (customizations.backgroundColor) {
            root.style.setProperty('--flextime-bg', customizations.backgroundColor);
        }
        if (customizations.textColor) {
            root.style.setProperty('--flextime-text', customizations.textColor);
        }
        if (customizations.borderRadius !== undefined) {
            root.style.setProperty('--flextime-border-radius', `${customizations.borderRadius}px`);
        }
        if (customizations.fontFamily) {
            root.style.setProperty('--flextime-font-family', customizations.fontFamily);
        }
        if (customizations.glassIntensity !== undefined) {
            root.style.setProperty('--flextime-glass-intensity', customizations.glassIntensity.toString());
        }
        // Motion preference
        if (customizations.motionPreference) {
            root.setAttribute('data-motion-preference', customizations.motionPreference);
        }
        // Contrast mode
        if (customizations.contrastMode) {
            root.setAttribute('data-contrast-mode', customizations.contrastMode);
        }
    }
};
const ThemeProvider = ({ children })=>{
    // Initialize theme state from localStorage
    const [theme, setTheme] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(getInitialTheme);
    // Get the current sport configuration from context
    const { currentSportType } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$contexts$2f$SportConfigContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSportConfigContext"])();
    // Theme manipulation functions
    const setThemeMode = (mode)=>{
        setTheme((prev)=>({
                ...prev,
                mode
            }));
    };
    const toggleTheme = ()=>{
        setTheme((prev)=>({
                ...prev,
                mode: prev.mode === 'light' ? 'dark' : 'light'
            }));
    };
    const setSportTheme = (sport)=>{
        setTheme((prev)=>({
                ...prev,
                sport,
                // Clear team when sport changes to avoid conflicts
                team: undefined
            }));
    };
    const setTeamTheme = (team)=>{
        setTheme((prev)=>{
            // Apply team colors to customizations if Big 12 team
            const teamColors = BIG12_TEAMS[team];
            const teamCustomizations = teamColors ? {
                primaryColor: teamColors.primary,
                secondaryColor: teamColors.secondary,
                accentColor: teamColors.primary
            } : {};
            return {
                ...prev,
                team,
                customizations: {
                    ...prev.customizations,
                    ...teamCustomizations
                }
            };
        });
    };
    const setCustomizations = (customizations)=>{
        setTheme((prev)=>({
                ...prev,
                customizations: {
                    ...prev.customizations,
                    ...customizations
                }
            }));
    };
    const resetTheme = useCallback(()=>{
        setTheme({
            mode: theme.mode
        }); // Keep current mode but reset everything else
    }, [
        theme.mode
    ]);
    // Save theme to localStorage and apply to document when theme changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        saveThemeToStorage(theme);
        applyThemeToDocument(theme);
    }, [
        theme
    ]);
    // Update sport from context if it changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (currentSportType && currentSportType !== theme.sport) {
            setSportTheme(currentSportType);
        }
    }, [
        currentSportType,
        theme.sport
    ]);
    // Create the MUI theme object
    const muiTheme = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        let sportType = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SportType"].FOOTBALL; // Default
        // Try to match sport string to SportType enum
        if (theme.sport) {
            const matchedSport = Object.values(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SportType"]).find((sport)=>sport.toLowerCase() === theme.sport.toLowerCase());
            if (matchedSport) {
                sportType = matchedSport;
            }
        }
        // Use current sport type from context if available
        if (currentSportType) {
            sportType = currentSportType;
        }
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$theme$2f$extendedTheme$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"])(theme.mode, sportType);
    }, [
        theme.mode,
        theme.sport,
        currentSportType
    ]);
    // Create the context value
    const contextValue = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>({
            theme,
            themeMode: theme.mode,
            setThemeMode,
            toggleTheme,
            setSportTheme,
            setTeamTheme,
            setCustomizations,
            resetTheme,
            currentSport: theme.sport || currentSportType,
            currentTeam: theme.team
        }), [
        theme,
        currentSportType,
        resetTheme
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ThemeContext.Provider, {
        value: contextValue,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$styles$2f$ThemeProvider$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ThemeProvider$3e$__["ThemeProvider"], {
            theme: muiTheme,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$CssBaseline$2f$CssBaseline$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                    fileName: "[project]/frontend/src/contexts/ThemeContext.tsx",
                    lineNumber: 327,
                    columnNumber: 9
                }, this),
                children
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/contexts/ThemeContext.tsx",
            lineNumber: 326,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/src/contexts/ThemeContext.tsx",
        lineNumber: 325,
        columnNumber: 5
    }, this);
};
const useThemeContext = ()=>{
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(ThemeContext);
    if (context === undefined) {
        throw new Error('useThemeContext must be used within a ThemeProvider');
    }
    return context;
};
const useThemeMode = ()=>{
    const { themeMode } = useThemeContext();
    return themeMode;
};
const useSportTeamTheme = ()=>{
    const { currentSport, currentTeam, setSportTheme, setTeamTheme } = useThemeContext();
    return {
        currentSport,
        currentTeam,
        setSportTheme,
        setTeamTheme
    };
};
const useThemeCustomizations = ()=>{
    const { theme, setCustomizations, resetTheme } = useThemeContext();
    return {
        customizations: theme.customizations,
        setCustomizations,
        resetTheme
    };
};
;
const __TURBOPACK__default__export__ = ThemeProvider;
}),
"[project]/frontend/src/components/ui/FlexTimeThemeToggle.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "FlexTimeThemeToggle": (()=>FlexTimeThemeToggle)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sun$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Sun$3e$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/icons/sun.mjs [app-ssr] (ecmascript) <export default as Sun>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$moon$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Moon$3e$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/icons/moon.mjs [app-ssr] (ecmascript) <export default as Moon>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$toggle$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/components/ui/toggle.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$contexts$2f$ThemeContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/contexts/ThemeContext.tsx [app-ssr] (ecmascript)");
'use client';
;
;
;
;
function FlexTimeThemeToggle() {
    const { themeMode, toggleTheme } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$contexts$2f$ThemeContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useThemeContext"])();
    const isDark = themeMode === 'dark';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$toggle$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Toggle"], {
        pressed: isDark,
        onPressedChange: toggleTheme,
        "aria-label": `Switch to ${isDark ? 'light' : 'dark'} mode`,
        className: "relative w-12 h-12 rounded-lg bg-white/10 dark:bg-white/10 backdrop-blur-sm border border-white/20 dark:border-white/20 hover:bg-white/20 dark:hover:bg-white/20 transition-all duration-300 group data-[state=on]:bg-gray-900/80 data-[state=off]:bg-slate-100/80",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative w-6 h-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sun$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Sun$3e$__["Sun"], {
                        className: `absolute inset-0 transform transition-all duration-300 ${!isDark ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'} text-yellow-600 dark:text-yellow-500`,
                        size: 24
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/ui/FlexTimeThemeToggle.tsx",
                        lineNumber: 20,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$moon$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Moon$3e$__["Moon"], {
                        className: `absolute inset-0 transform transition-all duration-300 ${isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'} text-blue-300 dark:text-blue-400`,
                        size: 24
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/ui/FlexTimeThemeToggle.tsx",
                        lineNumber: 28,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/ui/FlexTimeThemeToggle.tsx",
                lineNumber: 19,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${!isDark ? 'bg-yellow-500/20 shadow-yellow-500/20' : 'bg-blue-400/20 shadow-blue-400/20'} shadow-lg`
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/FlexTimeThemeToggle.tsx",
                lineNumber: 39,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/ui/FlexTimeThemeToggle.tsx",
        lineNumber: 13,
        columnNumber: 5
    }, this);
}
}),
"[project]/frontend/app/components/Navbar.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "default": (()=>Navbar)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$FlexTimeShinyButton$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/FlexTimeShinyButton.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$FTLogo$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/FTLogo.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$FlexTimeThemeToggle$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/FlexTimeThemeToggle.tsx [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
;
function Navbar() {
    const [isScrolled, setIsScrolled] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isMenuOpen, setIsMenuOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePathname"])();
    // Handle scroll effect for glassmorphic transparency
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const handleScroll = ()=>{
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return ()=>window.removeEventListener('scroll', handleScroll);
    }, []);
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
        className: `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-black/80 backdrop-blur-md border-b border-cyan-900/30' : 'bg-transparent'}`,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "max-w-[calc(100%-4rem)] mx-auto px-6 py-4",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                            href: "/",
                            className: "flex items-center gap-2",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$FTLogo$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FTLogo"], {
                                variant: "white",
                                size: "sm",
                                alt: "FlexTime Logo",
                                showText: true,
                                className: "flex items-center"
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/components/Navbar.tsx",
                                lineNumber: 46,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/frontend/app/components/Navbar.tsx",
                            lineNumber: 45,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "hidden md:flex items-center space-x-8",
                            children: menuItems.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    href: item.path,
                                    className: `transition-all ${pathname === item.path ? 'border-b-2 border-[color:var(--ft-neon)]' : ''}`,
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: `text-sm font-medium ${pathname === item.path ? 'bg-gradient-to-r from-white to-[color:var(--ft-neon)] bg-clip-text text-transparent' : 'text-gray-300 hover:bg-gradient-to-r hover:from-white hover:to-[color:var(--ft-neon)] hover:bg-clip-text hover:text-transparent'}`,
                                        style: {
                                            fontFamily: 'var(--ft-font-secondary)'
                                        },
                                        children: item.label.toUpperCase()
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/components/Navbar.tsx",
                                        lineNumber: 67,
                                        columnNumber: 17
                                    }, this)
                                }, item.path, false, {
                                    fileName: "[project]/frontend/app/components/Navbar.tsx",
                                    lineNumber: 58,
                                    columnNumber: 15
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/frontend/app/components/Navbar.tsx",
                            lineNumber: 56,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "hidden md:flex items-center space-x-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$FlexTimeThemeToggle$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FlexTimeThemeToggle"], {}, void 0, false, {
                                    fileName: "[project]/frontend/app/components/Navbar.tsx",
                                    lineNumber: 76,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$FlexTimeShinyButton$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FlexTimeShinyButton"], {
                                    variant: "secondary",
                                    className: "px-4 py-2 text-sm",
                                    children: "Settings"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/app/components/Navbar.tsx",
                                    lineNumber: 77,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$FlexTimeShinyButton$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FlexTimeShinyButton"], {
                                    variant: "secondary",
                                    className: "px-4 py-2 text-sm",
                                    children: "Sign In"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/app/components/Navbar.tsx",
                                    lineNumber: 80,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/app/components/Navbar.tsx",
                            lineNumber: 75,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$FlexTimeShinyButton$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FlexTimeShinyButton"], {
                            variant: "secondary",
                            className: "md:hidden p-2 !min-w-0 !min-h-0",
                            onClick: ()=>setIsMenuOpen(!isMenuOpen),
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                xmlns: "http://www.w3.org/2000/svg",
                                className: "h-6 w-6",
                                fill: "none",
                                viewBox: "0 0 24 24",
                                stroke: "currentColor",
                                children: isMenuOpen ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    strokeWidth: 2,
                                    d: "M6 18L18 6M6 6l12 12"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/app/components/Navbar.tsx",
                                    lineNumber: 99,
                                    columnNumber: 17
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    strokeWidth: 2,
                                    d: "M4 6h16M4 12h16M4 18h16"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/app/components/Navbar.tsx",
                                    lineNumber: 106,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/components/Navbar.tsx",
                                lineNumber: 91,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/frontend/app/components/Navbar.tsx",
                            lineNumber: 86,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/app/components/Navbar.tsx",
                    lineNumber: 43,
                    columnNumber: 9
                }, this),
                isMenuOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "md:hidden mt-4 pb-4 space-y-3 animate-fadeIn",
                    children: [
                        menuItems.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                href: item.path,
                                className: `block py-2 px-4 text-base font-medium rounded-md transition-all ${pathname === item.path ? 'bg-black/40 text-[color:var(--ft-neon)] border-l-2 border-[color:var(--ft-neon)]' : 'text-gray-300 hover:bg-black/20'}`,
                                onClick: ()=>setIsMenuOpen(false),
                                children: item.label
                            }, item.path, false, {
                                fileName: "[project]/frontend/app/components/Navbar.tsx",
                                lineNumber: 121,
                                columnNumber: 15
                            }, this)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "pt-4 flex flex-col space-y-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$FlexTimeShinyButton$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FlexTimeShinyButton"], {
                                    variant: "secondary",
                                    className: "py-2 text-sm",
                                    children: "Settings"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/app/components/Navbar.tsx",
                                    lineNumber: 135,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$FlexTimeShinyButton$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FlexTimeShinyButton"], {
                                    variant: "secondary",
                                    className: "py-2 text-sm",
                                    children: "Sign In"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/app/components/Navbar.tsx",
                                    lineNumber: 138,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/app/components/Navbar.tsx",
                            lineNumber: 134,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/app/components/Navbar.tsx",
                    lineNumber: 119,
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
}),
"[project]/frontend/src/components/ui/FlexTimeAnimatedBackground.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "FlexTimeAnimatedBackground": (()=>FlexTimeAnimatedBackground)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
'use client';
;
;
function FlexTimeAnimatedBackground({ className = '', intensity = 'medium', showGrid = true, showFloatingElements = true }) {
    const [mouseGradientStyle, setMouseGradientStyle] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        left: '0px',
        top: '0px',
        opacity: 0
    });
    const [ripples, setRipples] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const handleMouseMove = (e)=>{
            setMouseGradientStyle({
                left: `${e.clientX}px`,
                top: `${e.clientY}px`,
                opacity: intensity === 'high' ? 0.8 : intensity === 'medium' ? 0.5 : 0.3
            });
        };
        const handleMouseLeave = ()=>{
            setMouseGradientStyle((prev)=>({
                    ...prev,
                    opacity: 0
                }));
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseleave', handleMouseLeave);
        return ()=>{
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [
        intensity
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const handleClick = (e)=>{
            const newRipple = {
                id: Date.now(),
                x: e.clientX,
                y: e.clientY
            };
            setRipples((prev)=>[
                    ...prev,
                    newRipple
                ]);
            setTimeout(()=>setRipples((prev)=>prev.filter((r)=>r.id !== newRipple.id)), 1000);
        };
        document.addEventListener('click', handleClick);
        return ()=>document.removeEventListener('click', handleClick);
    }, []);
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("style", {
                children: backgroundStyles
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/FlexTimeAnimatedBackground.tsx",
                lineNumber: 165,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `absolute inset-0 overflow-hidden ${className}`,
                children: [
                    showGrid && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                        className: "absolute inset-0 w-full h-full pointer-events-none",
                        xmlns: "http://www.w3.org/2000/svg",
                        "aria-hidden": "true",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("defs", {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("pattern", {
                                    id: "ftGridPattern",
                                    width: "60",
                                    height: "60",
                                    patternUnits: "userSpaceOnUse",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                                width: "100%",
                                height: "100%",
                                fill: "url(#ftGridPattern)"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/ui/FlexTimeAnimatedBackground.tsx",
                                lineNumber: 186,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "ft-corner-element top-4 left-4",
                        style: {
                            animationDelay: '4s'
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "ft-corner-element top-4 right-4",
                        style: {
                            animationDelay: '4.2s'
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "ft-corner-element bottom-4 left-4",
                        style: {
                            animationDelay: '4.4s'
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "ft-corner-element bottom-4 right-4",
                        style: {
                            animationDelay: '4.6s'
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                    showFloatingElements && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                    ripples.map((ripple)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/dynamic-access-async-storage.external.js [external] (next/dist/server/app-render/dynamic-access-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/dynamic-access-async-storage.external.js", () => require("next/dist/server/app-render/dynamic-access-async-storage.external.js"));

module.exports = mod;
}}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__b14782c1._.js.map