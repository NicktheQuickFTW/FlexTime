(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/frontend/node_modules/lucide-react/dist/esm/defaultAttributes.mjs [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

/**
 * lucide-react v0.0.1 - ISC
 */ __turbopack_context__.s({
    "default": (()=>defaultAttributes)
});
var defaultAttributes = {
    xmlns: "http://www.w3.org/2000/svg",
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round"
};
;
 //# sourceMappingURL=defaultAttributes.mjs.map
}),
"[project]/frontend/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

/**
 * lucide-react v0.0.1 - ISC
 */ __turbopack_context__.s({
    "default": (()=>createLucideIcon$1),
    "toKebabCase": (()=>toKebabCase)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$defaultAttributes$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/defaultAttributes.mjs [app-client] (ecmascript)");
;
;
const toKebabCase = (string)=>string.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const createLucideIcon = (iconName, iconNode)=>{
    const Component = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(({ color = "currentColor", size = 24, strokeWidth = 2, absoluteStrokeWidth, children, ...rest }, ref)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"])("svg", {
            ref,
            ...__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$defaultAttributes$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"],
            width: size,
            height: size,
            stroke: color,
            strokeWidth: absoluteStrokeWidth ? Number(strokeWidth) * 24 / Number(size) : strokeWidth,
            className: `lucide lucide-${toKebabCase(iconName)}`,
            ...rest
        }, [
            ...iconNode.map(([tag, attrs])=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"])(tag, attrs)),
            ...(Array.isArray(children) ? children : [
                children
            ]) || []
        ]));
    Component.displayName = `${iconName}`;
    return Component;
};
var createLucideIcon$1 = createLucideIcon;
;
 //# sourceMappingURL=createLucideIcon.mjs.map
}),
"[project]/frontend/node_modules/lucide-react/dist/esm/icons/calendar.mjs [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

/**
 * lucide-react v0.0.1 - ISC
 */ __turbopack_context__.s({
    "default": (()=>Calendar)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)");
;
const Calendar = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("Calendar", [
    [
        "rect",
        {
            width: "18",
            height: "18",
            x: "3",
            y: "4",
            rx: "2",
            ry: "2",
            key: "eu3xkr"
        }
    ],
    [
        "line",
        {
            x1: "16",
            x2: "16",
            y1: "2",
            y2: "6",
            key: "m3sa8f"
        }
    ],
    [
        "line",
        {
            x1: "8",
            x2: "8",
            y1: "2",
            y2: "6",
            key: "18kwsl"
        }
    ],
    [
        "line",
        {
            x1: "3",
            x2: "21",
            y1: "10",
            y2: "10",
            key: "xt86sb"
        }
    ]
]);
;
 //# sourceMappingURL=calendar.mjs.map
}),
"[project]/frontend/node_modules/lucide-react/dist/esm/icons/calendar.mjs [app-client] (ecmascript) <export default as Calendar>": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "Calendar": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/icons/calendar.mjs [app-client] (ecmascript)");
}),
"[project]/frontend/node_modules/lucide-react/dist/esm/icons/grid.mjs [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

/**
 * lucide-react v0.0.1 - ISC
 */ __turbopack_context__.s({
    "default": (()=>Grid)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)");
;
const Grid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("Grid", [
    [
        "rect",
        {
            width: "18",
            height: "18",
            x: "3",
            y: "3",
            rx: "2",
            ry: "2",
            key: "1m3agn"
        }
    ],
    [
        "line",
        {
            x1: "3",
            x2: "21",
            y1: "9",
            y2: "9",
            key: "1vqk6q"
        }
    ],
    [
        "line",
        {
            x1: "3",
            x2: "21",
            y1: "15",
            y2: "15",
            key: "o2sbyz"
        }
    ],
    [
        "line",
        {
            x1: "9",
            x2: "9",
            y1: "3",
            y2: "21",
            key: "13tij5"
        }
    ],
    [
        "line",
        {
            x1: "15",
            x2: "15",
            y1: "3",
            y2: "21",
            key: "1hpv9i"
        }
    ]
]);
;
 //# sourceMappingURL=grid.mjs.map
}),
"[project]/frontend/node_modules/lucide-react/dist/esm/icons/grid.mjs [app-client] (ecmascript) <export default as Grid>": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "Grid": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$grid$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$grid$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/icons/grid.mjs [app-client] (ecmascript)");
}),
"[project]/frontend/node_modules/lucide-react/dist/esm/icons/bar-chart-3.mjs [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

/**
 * lucide-react v0.0.1 - ISC
 */ __turbopack_context__.s({
    "default": (()=>BarChart3)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)");
;
const BarChart3 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("BarChart3", [
    [
        "path",
        {
            d: "M3 3v18h18",
            key: "1s2lah"
        }
    ],
    [
        "path",
        {
            d: "M18 17V9",
            key: "2bz60n"
        }
    ],
    [
        "path",
        {
            d: "M13 17V5",
            key: "1frdt8"
        }
    ],
    [
        "path",
        {
            d: "M8 17v-3",
            key: "17ska0"
        }
    ]
]);
;
 //# sourceMappingURL=bar-chart-3.mjs.map
}),
"[project]/frontend/node_modules/lucide-react/dist/esm/icons/bar-chart-3.mjs [app-client] (ecmascript) <export default as BarChart3>": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "BarChart3": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bar$2d$chart$2d$3$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bar$2d$chart$2d$3$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/icons/bar-chart-3.mjs [app-client] (ecmascript)");
}),
"[project]/frontend/node_modules/lucide-react/dist/esm/icons/zap.mjs [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

/**
 * lucide-react v0.0.1 - ISC
 */ __turbopack_context__.s({
    "default": (()=>Zap)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)");
;
const Zap = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("Zap", [
    [
        "polygon",
        {
            points: "13 2 3 14 12 14 11 22 21 10 12 10 13 2",
            key: "45s27k"
        }
    ]
]);
;
 //# sourceMappingURL=zap.mjs.map
}),
"[project]/frontend/node_modules/lucide-react/dist/esm/icons/zap.mjs [app-client] (ecmascript) <export default as Zap>": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "Zap": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zap$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zap$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/icons/zap.mjs [app-client] (ecmascript)");
}),
"[project]/frontend/node_modules/lucide-react/dist/esm/icons/download.mjs [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

/**
 * lucide-react v0.0.1 - ISC
 */ __turbopack_context__.s({
    "default": (()=>Download)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)");
;
const Download = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("Download", [
    [
        "path",
        {
            d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",
            key: "ih7n3h"
        }
    ],
    [
        "polyline",
        {
            points: "7 10 12 15 17 10",
            key: "2ggqvy"
        }
    ],
    [
        "line",
        {
            x1: "12",
            x2: "12",
            y1: "15",
            y2: "3",
            key: "1vk2je"
        }
    ]
]);
;
 //# sourceMappingURL=download.mjs.map
}),
"[project]/frontend/node_modules/lucide-react/dist/esm/icons/download.mjs [app-client] (ecmascript) <export default as Download>": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "Download": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$download$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$download$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/icons/download.mjs [app-client] (ecmascript)");
}),
"[project]/frontend/node_modules/lucide-react/dist/esm/icons/save.mjs [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

/**
 * lucide-react v0.0.1 - ISC
 */ __turbopack_context__.s({
    "default": (()=>Save)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)");
;
const Save = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("Save", [
    [
        "path",
        {
            d: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z",
            key: "1owoqh"
        }
    ],
    [
        "polyline",
        {
            points: "17 21 17 13 7 13 7 21",
            key: "1md35c"
        }
    ],
    [
        "polyline",
        {
            points: "7 3 7 8 15 8",
            key: "8nz8an"
        }
    ]
]);
;
 //# sourceMappingURL=save.mjs.map
}),
"[project]/frontend/node_modules/lucide-react/dist/esm/icons/save.mjs [app-client] (ecmascript) <export default as Save>": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "Save": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/icons/save.mjs [app-client] (ecmascript)");
}),
"[project]/frontend/node_modules/lucide-react/dist/esm/icons/alert-triangle.mjs [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

/**
 * lucide-react v0.0.1 - ISC
 */ __turbopack_context__.s({
    "default": (()=>AlertTriangle)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)");
;
const AlertTriangle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("AlertTriangle", [
    [
        "path",
        {
            d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z",
            key: "c3ski4"
        }
    ],
    [
        "path",
        {
            d: "M12 9v4",
            key: "juzpu7"
        }
    ],
    [
        "path",
        {
            d: "M12 17h.01",
            key: "p32p05"
        }
    ]
]);
;
 //# sourceMappingURL=alert-triangle.mjs.map
}),
"[project]/frontend/node_modules/lucide-react/dist/esm/icons/alert-triangle.mjs [app-client] (ecmascript) <export default as AlertTriangle>": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "AlertTriangle": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$alert$2d$triangle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$alert$2d$triangle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/icons/alert-triangle.mjs [app-client] (ecmascript)");
}),
"[project]/frontend/node_modules/lucide-react/dist/esm/icons/eye.mjs [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

/**
 * lucide-react v0.0.1 - ISC
 */ __turbopack_context__.s({
    "default": (()=>Eye)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)");
;
const Eye = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("Eye", [
    [
        "path",
        {
            d: "M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z",
            key: "rwhkz3"
        }
    ],
    [
        "circle",
        {
            cx: "12",
            cy: "12",
            r: "3",
            key: "1v7zrd"
        }
    ]
]);
;
 //# sourceMappingURL=eye.mjs.map
}),
"[project]/frontend/node_modules/lucide-react/dist/esm/icons/eye.mjs [app-client] (ecmascript) <export default as Eye>": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "Eye": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/icons/eye.mjs [app-client] (ecmascript)");
}),
"[project]/frontend/node_modules/lucide-react/dist/esm/icons/eye-off.mjs [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

/**
 * lucide-react v0.0.1 - ISC
 */ __turbopack_context__.s({
    "default": (()=>EyeOff)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)");
;
const EyeOff = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("EyeOff", [
    [
        "path",
        {
            d: "M9.88 9.88a3 3 0 1 0 4.24 4.24",
            key: "1jxqfv"
        }
    ],
    [
        "path",
        {
            d: "M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68",
            key: "9wicm4"
        }
    ],
    [
        "path",
        {
            d: "M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61",
            key: "1jreej"
        }
    ],
    [
        "line",
        {
            x1: "2",
            x2: "22",
            y1: "2",
            y2: "22",
            key: "a6p6uj"
        }
    ]
]);
;
 //# sourceMappingURL=eye-off.mjs.map
}),
"[project]/frontend/node_modules/lucide-react/dist/esm/icons/eye-off.mjs [app-client] (ecmascript) <export default as EyeOff>": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "EyeOff": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2d$off$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2d$off$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/icons/eye-off.mjs [app-client] (ecmascript)");
}),
"[project]/frontend/node_modules/lucide-react/dist/esm/icons/plus.mjs [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

/**
 * lucide-react v0.0.1 - ISC
 */ __turbopack_context__.s({
    "default": (()=>Plus)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)");
;
const Plus = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("Plus", [
    [
        "path",
        {
            d: "M5 12h14",
            key: "1ays0h"
        }
    ],
    [
        "path",
        {
            d: "M12 5v14",
            key: "s699le"
        }
    ]
]);
;
 //# sourceMappingURL=plus.mjs.map
}),
"[project]/frontend/node_modules/lucide-react/dist/esm/icons/plus.mjs [app-client] (ecmascript) <export default as Plus>": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "Plus": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/icons/plus.mjs [app-client] (ecmascript)");
}),
"[project]/frontend/node_modules/lucide-react/dist/esm/icons/file-text.mjs [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

/**
 * lucide-react v0.0.1 - ISC
 */ __turbopack_context__.s({
    "default": (()=>FileText)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)");
;
const FileText = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("FileText", [
    [
        "path",
        {
            d: "M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z",
            key: "1nnpy2"
        }
    ],
    [
        "polyline",
        {
            points: "14 2 14 8 20 8",
            key: "1ew0cm"
        }
    ],
    [
        "line",
        {
            x1: "16",
            x2: "8",
            y1: "13",
            y2: "13",
            key: "14keom"
        }
    ],
    [
        "line",
        {
            x1: "16",
            x2: "8",
            y1: "17",
            y2: "17",
            key: "17nazh"
        }
    ],
    [
        "line",
        {
            x1: "10",
            x2: "8",
            y1: "9",
            y2: "9",
            key: "1a5vjj"
        }
    ]
]);
;
 //# sourceMappingURL=file-text.mjs.map
}),
"[project]/frontend/node_modules/lucide-react/dist/esm/icons/file-text.mjs [app-client] (ecmascript) <export default as FileText>": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "FileText": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/icons/file-text.mjs [app-client] (ecmascript)");
}),
"[project]/frontend/node_modules/lucide-react/dist/esm/icons/loader.mjs [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

/**
 * lucide-react v0.0.1 - ISC
 */ __turbopack_context__.s({
    "default": (()=>Loader)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)");
;
const Loader = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("Loader", [
    [
        "line",
        {
            x1: "12",
            x2: "12",
            y1: "2",
            y2: "6",
            key: "gza1u7"
        }
    ],
    [
        "line",
        {
            x1: "12",
            x2: "12",
            y1: "18",
            y2: "22",
            key: "1qhbu9"
        }
    ],
    [
        "line",
        {
            x1: "4.93",
            x2: "7.76",
            y1: "4.93",
            y2: "7.76",
            key: "xae44r"
        }
    ],
    [
        "line",
        {
            x1: "16.24",
            x2: "19.07",
            y1: "16.24",
            y2: "19.07",
            key: "bxnmvf"
        }
    ],
    [
        "line",
        {
            x1: "2",
            x2: "6",
            y1: "12",
            y2: "12",
            key: "89khin"
        }
    ],
    [
        "line",
        {
            x1: "18",
            x2: "22",
            y1: "12",
            y2: "12",
            key: "pb8tfm"
        }
    ],
    [
        "line",
        {
            x1: "4.93",
            x2: "7.76",
            y1: "19.07",
            y2: "16.24",
            key: "1uxjnu"
        }
    ],
    [
        "line",
        {
            x1: "16.24",
            x2: "19.07",
            y1: "7.76",
            y2: "4.93",
            key: "6duxfx"
        }
    ]
]);
;
 //# sourceMappingURL=loader.mjs.map
}),
"[project]/frontend/node_modules/lucide-react/dist/esm/icons/loader.mjs [app-client] (ecmascript) <export default as Loader>": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "Loader": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/icons/loader.mjs [app-client] (ecmascript)");
}),
"[project]/frontend/node_modules/lucide-react/dist/esm/icons/x.mjs [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

/**
 * lucide-react v0.0.1 - ISC
 */ __turbopack_context__.s({
    "default": (()=>X)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)");
;
const X = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("X", [
    [
        "path",
        {
            d: "M18 6 6 18",
            key: "1bl5f8"
        }
    ],
    [
        "path",
        {
            d: "m6 6 12 12",
            key: "d8bk6v"
        }
    ]
]);
;
 //# sourceMappingURL=x.mjs.map
}),
"[project]/frontend/node_modules/lucide-react/dist/esm/icons/x.mjs [app-client] (ecmascript) <export default as X>": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "X": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/icons/x.mjs [app-client] (ecmascript)");
}),
"[project]/node_modules/@iconify/react/dist/iconify.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "Icon": (()=>Icon),
    "InlineIcon": (()=>InlineIcon),
    "_api": (()=>_api),
    "addAPIProvider": (()=>addAPIProvider),
    "addCollection": (()=>addCollection),
    "addIcon": (()=>addIcon),
    "buildIcon": (()=>iconToSVG),
    "calculateSize": (()=>calculateSize),
    "getIcon": (()=>getIcon),
    "iconLoaded": (()=>iconLoaded),
    "listIcons": (()=>listIcons),
    "loadIcon": (()=>loadIcon),
    "loadIcons": (()=>loadIcons),
    "replaceIDs": (()=>replaceIDs),
    "setCustomIconLoader": (()=>setCustomIconLoader),
    "setCustomIconsLoader": (()=>setCustomIconsLoader)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
'use client';
;
const defaultIconDimensions = Object.freeze({
    left: 0,
    top: 0,
    width: 16,
    height: 16
});
const defaultIconTransformations = Object.freeze({
    rotate: 0,
    vFlip: false,
    hFlip: false
});
const defaultIconProps = Object.freeze({
    ...defaultIconDimensions,
    ...defaultIconTransformations
});
const defaultExtendedIconProps = Object.freeze({
    ...defaultIconProps,
    body: "",
    hidden: false
});
function mergeIconTransformations(obj1, obj2) {
    const result = {};
    if (!obj1.hFlip !== !obj2.hFlip) {
        result.hFlip = true;
    }
    if (!obj1.vFlip !== !obj2.vFlip) {
        result.vFlip = true;
    }
    const rotate = ((obj1.rotate || 0) + (obj2.rotate || 0)) % 4;
    if (rotate) {
        result.rotate = rotate;
    }
    return result;
}
function mergeIconData(parent, child) {
    const result = mergeIconTransformations(parent, child);
    for(const key in defaultExtendedIconProps){
        if (key in defaultIconTransformations) {
            if (key in parent && !(key in result)) {
                result[key] = defaultIconTransformations[key];
            }
        } else if (key in child) {
            result[key] = child[key];
        } else if (key in parent) {
            result[key] = parent[key];
        }
    }
    return result;
}
function getIconsTree(data, names) {
    const icons = data.icons;
    const aliases = data.aliases || /* @__PURE__ */ Object.create(null);
    const resolved = /* @__PURE__ */ Object.create(null);
    function resolve(name) {
        if (icons[name]) {
            return resolved[name] = [];
        }
        if (!(name in resolved)) {
            resolved[name] = null;
            const parent = aliases[name] && aliases[name].parent;
            const value = parent && resolve(parent);
            if (value) {
                resolved[name] = [
                    parent
                ].concat(value);
            }
        }
        return resolved[name];
    }
    Object.keys(icons).concat(Object.keys(aliases)).forEach(resolve);
    return resolved;
}
function internalGetIconData(data, name, tree) {
    const icons = data.icons;
    const aliases = data.aliases || /* @__PURE__ */ Object.create(null);
    let currentProps = {};
    function parse(name2) {
        currentProps = mergeIconData(icons[name2] || aliases[name2], currentProps);
    }
    parse(name);
    tree.forEach(parse);
    return mergeIconData(data, currentProps);
}
function parseIconSet(data, callback) {
    const names = [];
    if (typeof data !== "object" || typeof data.icons !== "object") {
        return names;
    }
    if (data.not_found instanceof Array) {
        data.not_found.forEach((name)=>{
            callback(name, null);
            names.push(name);
        });
    }
    const tree = getIconsTree(data);
    for(const name in tree){
        const item = tree[name];
        if (item) {
            callback(name, internalGetIconData(data, name, item));
            names.push(name);
        }
    }
    return names;
}
const optionalPropertyDefaults = {
    provider: "",
    aliases: {},
    not_found: {},
    ...defaultIconDimensions
};
function checkOptionalProps(item, defaults) {
    for(const prop in defaults){
        if (prop in item && typeof item[prop] !== typeof defaults[prop]) {
            return false;
        }
    }
    return true;
}
function quicklyValidateIconSet(obj) {
    if (typeof obj !== "object" || obj === null) {
        return null;
    }
    const data = obj;
    if (typeof data.prefix !== "string" || !obj.icons || typeof obj.icons !== "object") {
        return null;
    }
    if (!checkOptionalProps(obj, optionalPropertyDefaults)) {
        return null;
    }
    const icons = data.icons;
    for(const name in icons){
        const icon = icons[name];
        if (// Name cannot be empty
        !name || // Must have body
        typeof icon.body !== "string" || // Check other props
        !checkOptionalProps(icon, defaultExtendedIconProps)) {
            return null;
        }
    }
    const aliases = data.aliases || /* @__PURE__ */ Object.create(null);
    for(const name in aliases){
        const icon = aliases[name];
        const parent = icon.parent;
        if (// Name cannot be empty
        !name || // Parent must be set and point to existing icon
        typeof parent !== "string" || !icons[parent] && !aliases[parent] || // Check other props
        !checkOptionalProps(icon, defaultExtendedIconProps)) {
            return null;
        }
    }
    return data;
}
const matchIconName = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const stringToIcon = (value, validate, allowSimpleName, provider = "")=>{
    const colonSeparated = value.split(":");
    if (value.slice(0, 1) === "@") {
        if (colonSeparated.length < 2 || colonSeparated.length > 3) {
            return null;
        }
        provider = colonSeparated.shift().slice(1);
    }
    if (colonSeparated.length > 3 || !colonSeparated.length) {
        return null;
    }
    if (colonSeparated.length > 1) {
        const name2 = colonSeparated.pop();
        const prefix = colonSeparated.pop();
        const result = {
            // Allow provider without '@': "provider:prefix:name"
            provider: colonSeparated.length > 0 ? colonSeparated[0] : provider,
            prefix,
            name: name2
        };
        return validate && !validateIconName(result) ? null : result;
    }
    const name = colonSeparated[0];
    const dashSeparated = name.split("-");
    if (dashSeparated.length > 1) {
        const result = {
            provider,
            prefix: dashSeparated.shift(),
            name: dashSeparated.join("-")
        };
        return validate && !validateIconName(result) ? null : result;
    }
    if (allowSimpleName && provider === "") {
        const result = {
            provider,
            prefix: "",
            name
        };
        return validate && !validateIconName(result, allowSimpleName) ? null : result;
    }
    return null;
};
const validateIconName = (icon, allowSimpleName)=>{
    if (!icon) {
        return false;
    }
    return !!// Check name: cannot be empty
    ((allowSimpleName && icon.prefix === "" || !!icon.prefix) && !!icon.name);
};
const dataStorage = /* @__PURE__ */ Object.create(null);
function newStorage(provider, prefix) {
    return {
        provider,
        prefix,
        icons: /* @__PURE__ */ Object.create(null),
        missing: /* @__PURE__ */ new Set()
    };
}
function getStorage(provider, prefix) {
    const providerStorage = dataStorage[provider] || (dataStorage[provider] = /* @__PURE__ */ Object.create(null));
    return providerStorage[prefix] || (providerStorage[prefix] = newStorage(provider, prefix));
}
function addIconSet(storage, data) {
    if (!quicklyValidateIconSet(data)) {
        return [];
    }
    return parseIconSet(data, (name, icon)=>{
        if (icon) {
            storage.icons[name] = icon;
        } else {
            storage.missing.add(name);
        }
    });
}
function addIconToStorage(storage, name, icon) {
    try {
        if (typeof icon.body === "string") {
            storage.icons[name] = {
                ...icon
            };
            return true;
        }
    } catch (err) {}
    return false;
}
function listIcons(provider, prefix) {
    let allIcons = [];
    const providers = typeof provider === "string" ? [
        provider
    ] : Object.keys(dataStorage);
    providers.forEach((provider2)=>{
        const prefixes = typeof provider2 === "string" && typeof prefix === "string" ? [
            prefix
        ] : Object.keys(dataStorage[provider2] || {});
        prefixes.forEach((prefix2)=>{
            const storage = getStorage(provider2, prefix2);
            allIcons = allIcons.concat(Object.keys(storage.icons).map((name)=>(provider2 !== "" ? "@" + provider2 + ":" : "") + prefix2 + ":" + name));
        });
    });
    return allIcons;
}
let simpleNames = false;
function allowSimpleNames(allow) {
    if (typeof allow === "boolean") {
        simpleNames = allow;
    }
    return simpleNames;
}
function getIconData(name) {
    const icon = typeof name === "string" ? stringToIcon(name, true, simpleNames) : name;
    if (icon) {
        const storage = getStorage(icon.provider, icon.prefix);
        const iconName = icon.name;
        return storage.icons[iconName] || (storage.missing.has(iconName) ? null : void 0);
    }
}
function addIcon(name, data) {
    const icon = stringToIcon(name, true, simpleNames);
    if (!icon) {
        return false;
    }
    const storage = getStorage(icon.provider, icon.prefix);
    if (data) {
        return addIconToStorage(storage, icon.name, data);
    } else {
        storage.missing.add(icon.name);
        return true;
    }
}
function addCollection(data, provider) {
    if (typeof data !== "object") {
        return false;
    }
    if (typeof provider !== "string") {
        provider = data.provider || "";
    }
    if (simpleNames && !provider && !data.prefix) {
        let added = false;
        if (quicklyValidateIconSet(data)) {
            data.prefix = "";
            parseIconSet(data, (name, icon)=>{
                if (addIcon(name, icon)) {
                    added = true;
                }
            });
        }
        return added;
    }
    const prefix = data.prefix;
    if (!validateIconName({
        prefix,
        name: "a"
    })) {
        return false;
    }
    const storage = getStorage(provider, prefix);
    return !!addIconSet(storage, data);
}
function iconLoaded(name) {
    return !!getIconData(name);
}
function getIcon(name) {
    const result = getIconData(name);
    return result ? {
        ...defaultIconProps,
        ...result
    } : result;
}
const defaultIconSizeCustomisations = Object.freeze({
    width: null,
    height: null
});
const defaultIconCustomisations = Object.freeze({
    // Dimensions
    ...defaultIconSizeCustomisations,
    // Transformations
    ...defaultIconTransformations
});
const unitsSplit = /(-?[0-9.]*[0-9]+[0-9.]*)/g;
const unitsTest = /^-?[0-9.]*[0-9]+[0-9.]*$/g;
function calculateSize(size, ratio, precision) {
    if (ratio === 1) {
        return size;
    }
    precision = precision || 100;
    if (typeof size === "number") {
        return Math.ceil(size * ratio * precision) / precision;
    }
    if (typeof size !== "string") {
        return size;
    }
    const oldParts = size.split(unitsSplit);
    if (oldParts === null || !oldParts.length) {
        return size;
    }
    const newParts = [];
    let code = oldParts.shift();
    let isNumber = unitsTest.test(code);
    while(true){
        if (isNumber) {
            const num = parseFloat(code);
            if (isNaN(num)) {
                newParts.push(code);
            } else {
                newParts.push(Math.ceil(num * ratio * precision) / precision);
            }
        } else {
            newParts.push(code);
        }
        code = oldParts.shift();
        if (code === void 0) {
            return newParts.join("");
        }
        isNumber = !isNumber;
    }
}
function splitSVGDefs(content, tag = "defs") {
    let defs = "";
    const index = content.indexOf("<" + tag);
    while(index >= 0){
        const start = content.indexOf(">", index);
        const end = content.indexOf("</" + tag);
        if (start === -1 || end === -1) {
            break;
        }
        const endEnd = content.indexOf(">", end);
        if (endEnd === -1) {
            break;
        }
        defs += content.slice(start + 1, end).trim();
        content = content.slice(0, index).trim() + content.slice(endEnd + 1);
    }
    return {
        defs,
        content
    };
}
function mergeDefsAndContent(defs, content) {
    return defs ? "<defs>" + defs + "</defs>" + content : content;
}
function wrapSVGContent(body, start, end) {
    const split = splitSVGDefs(body);
    return mergeDefsAndContent(split.defs, start + split.content + end);
}
const isUnsetKeyword = (value)=>value === "unset" || value === "undefined" || value === "none";
function iconToSVG(icon, customisations) {
    const fullIcon = {
        ...defaultIconProps,
        ...icon
    };
    const fullCustomisations = {
        ...defaultIconCustomisations,
        ...customisations
    };
    const box = {
        left: fullIcon.left,
        top: fullIcon.top,
        width: fullIcon.width,
        height: fullIcon.height
    };
    let body = fullIcon.body;
    [
        fullIcon,
        fullCustomisations
    ].forEach((props)=>{
        const transformations = [];
        const hFlip = props.hFlip;
        const vFlip = props.vFlip;
        let rotation = props.rotate;
        if (hFlip) {
            if (vFlip) {
                rotation += 2;
            } else {
                transformations.push("translate(" + (box.width + box.left).toString() + " " + (0 - box.top).toString() + ")");
                transformations.push("scale(-1 1)");
                box.top = box.left = 0;
            }
        } else if (vFlip) {
            transformations.push("translate(" + (0 - box.left).toString() + " " + (box.height + box.top).toString() + ")");
            transformations.push("scale(1 -1)");
            box.top = box.left = 0;
        }
        let tempValue;
        if (rotation < 0) {
            rotation -= Math.floor(rotation / 4) * 4;
        }
        rotation = rotation % 4;
        switch(rotation){
            case 1:
                tempValue = box.height / 2 + box.top;
                transformations.unshift("rotate(90 " + tempValue.toString() + " " + tempValue.toString() + ")");
                break;
            case 2:
                transformations.unshift("rotate(180 " + (box.width / 2 + box.left).toString() + " " + (box.height / 2 + box.top).toString() + ")");
                break;
            case 3:
                tempValue = box.width / 2 + box.left;
                transformations.unshift("rotate(-90 " + tempValue.toString() + " " + tempValue.toString() + ")");
                break;
        }
        if (rotation % 2 === 1) {
            if (box.left !== box.top) {
                tempValue = box.left;
                box.left = box.top;
                box.top = tempValue;
            }
            if (box.width !== box.height) {
                tempValue = box.width;
                box.width = box.height;
                box.height = tempValue;
            }
        }
        if (transformations.length) {
            body = wrapSVGContent(body, '<g transform="' + transformations.join(" ") + '">', "</g>");
        }
    });
    const customisationsWidth = fullCustomisations.width;
    const customisationsHeight = fullCustomisations.height;
    const boxWidth = box.width;
    const boxHeight = box.height;
    let width;
    let height;
    if (customisationsWidth === null) {
        height = customisationsHeight === null ? "1em" : customisationsHeight === "auto" ? boxHeight : customisationsHeight;
        width = calculateSize(height, boxWidth / boxHeight);
    } else {
        width = customisationsWidth === "auto" ? boxWidth : customisationsWidth;
        height = customisationsHeight === null ? calculateSize(width, boxHeight / boxWidth) : customisationsHeight === "auto" ? boxHeight : customisationsHeight;
    }
    const attributes = {};
    const setAttr = (prop, value)=>{
        if (!isUnsetKeyword(value)) {
            attributes[prop] = value.toString();
        }
    };
    setAttr("width", width);
    setAttr("height", height);
    const viewBox = [
        box.left,
        box.top,
        boxWidth,
        boxHeight
    ];
    attributes.viewBox = viewBox.join(" ");
    return {
        attributes,
        viewBox,
        body
    };
}
const regex = /\sid="(\S+)"/g;
const randomPrefix = "IconifyId" + Date.now().toString(16) + (Math.random() * 16777216 | 0).toString(16);
let counter = 0;
function replaceIDs(body, prefix = randomPrefix) {
    const ids = [];
    let match;
    while(match = regex.exec(body)){
        ids.push(match[1]);
    }
    if (!ids.length) {
        return body;
    }
    const suffix = "suffix" + (Math.random() * 16777216 | Date.now()).toString(16);
    ids.forEach((id)=>{
        const newID = typeof prefix === "function" ? prefix(id) : prefix + (counter++).toString();
        const escapedID = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        body = body.replace(// Allowed characters before id: [#;"]
        // Allowed characters after id: [)"], .[a-z]
        new RegExp('([#;"])(' + escapedID + ')([")]|\\.[a-z])', "g"), "$1" + newID + suffix + "$3");
    });
    body = body.replace(new RegExp(suffix, "g"), "");
    return body;
}
const storage = /* @__PURE__ */ Object.create(null);
function setAPIModule(provider, item) {
    storage[provider] = item;
}
function getAPIModule(provider) {
    return storage[provider] || storage[""];
}
function createAPIConfig(source) {
    let resources;
    if (typeof source.resources === "string") {
        resources = [
            source.resources
        ];
    } else {
        resources = source.resources;
        if (!(resources instanceof Array) || !resources.length) {
            return null;
        }
    }
    const result = {
        // API hosts
        resources,
        // Root path
        path: source.path || "/",
        // URL length limit
        maxURL: source.maxURL || 500,
        // Timeout before next host is used.
        rotate: source.rotate || 750,
        // Timeout before failing query.
        timeout: source.timeout || 5e3,
        // Randomise default API end point.
        random: source.random === true,
        // Start index
        index: source.index || 0,
        // Receive data after time out (used if time out kicks in first, then API module sends data anyway).
        dataAfterTimeout: source.dataAfterTimeout !== false
    };
    return result;
}
const configStorage = /* @__PURE__ */ Object.create(null);
const fallBackAPISources = [
    "https://api.simplesvg.com",
    "https://api.unisvg.com"
];
const fallBackAPI = [];
while(fallBackAPISources.length > 0){
    if (fallBackAPISources.length === 1) {
        fallBackAPI.push(fallBackAPISources.shift());
    } else {
        if (Math.random() > 0.5) {
            fallBackAPI.push(fallBackAPISources.shift());
        } else {
            fallBackAPI.push(fallBackAPISources.pop());
        }
    }
}
configStorage[""] = createAPIConfig({
    resources: [
        "https://api.iconify.design"
    ].concat(fallBackAPI)
});
function addAPIProvider(provider, customConfig) {
    const config = createAPIConfig(customConfig);
    if (config === null) {
        return false;
    }
    configStorage[provider] = config;
    return true;
}
function getAPIConfig(provider) {
    return configStorage[provider];
}
function listAPIProviders() {
    return Object.keys(configStorage);
}
const detectFetch = ()=>{
    let callback;
    try {
        callback = fetch;
        if (typeof callback === "function") {
            return callback;
        }
    } catch (err) {}
};
let fetchModule = detectFetch();
function setFetch(fetch2) {
    fetchModule = fetch2;
}
function getFetch() {
    return fetchModule;
}
function calculateMaxLength(provider, prefix) {
    const config = getAPIConfig(provider);
    if (!config) {
        return 0;
    }
    let result;
    if (!config.maxURL) {
        result = 0;
    } else {
        let maxHostLength = 0;
        config.resources.forEach((item)=>{
            const host = item;
            maxHostLength = Math.max(maxHostLength, host.length);
        });
        const url = prefix + ".json?icons=";
        result = config.maxURL - maxHostLength - config.path.length - url.length;
    }
    return result;
}
function shouldAbort(status) {
    return status === 404;
}
const prepare = (provider, prefix, icons)=>{
    const results = [];
    const maxLength = calculateMaxLength(provider, prefix);
    const type = "icons";
    let item = {
        type,
        provider,
        prefix,
        icons: []
    };
    let length = 0;
    icons.forEach((name, index)=>{
        length += name.length + 1;
        if (length >= maxLength && index > 0) {
            results.push(item);
            item = {
                type,
                provider,
                prefix,
                icons: []
            };
            length = name.length;
        }
        item.icons.push(name);
    });
    results.push(item);
    return results;
};
function getPath(provider) {
    if (typeof provider === "string") {
        const config = getAPIConfig(provider);
        if (config) {
            return config.path;
        }
    }
    return "/";
}
const send = (host, params, callback)=>{
    if (!fetchModule) {
        callback("abort", 424);
        return;
    }
    let path = getPath(params.provider);
    switch(params.type){
        case "icons":
            {
                const prefix = params.prefix;
                const icons = params.icons;
                const iconsList = icons.join(",");
                const urlParams = new URLSearchParams({
                    icons: iconsList
                });
                path += prefix + ".json?" + urlParams.toString();
                break;
            }
        case "custom":
            {
                const uri = params.uri;
                path += uri.slice(0, 1) === "/" ? uri.slice(1) : uri;
                break;
            }
        default:
            callback("abort", 400);
            return;
    }
    let defaultError = 503;
    fetchModule(host + path).then((response)=>{
        const status = response.status;
        if (status !== 200) {
            setTimeout(()=>{
                callback(shouldAbort(status) ? "abort" : "next", status);
            });
            return;
        }
        defaultError = 501;
        return response.json();
    }).then((data)=>{
        if (typeof data !== "object" || data === null) {
            setTimeout(()=>{
                if (data === 404) {
                    callback("abort", data);
                } else {
                    callback("next", defaultError);
                }
            });
            return;
        }
        setTimeout(()=>{
            callback("success", data);
        });
    }).catch(()=>{
        callback("next", defaultError);
    });
};
const fetchAPIModule = {
    prepare,
    send
};
function sortIcons(icons) {
    const result = {
        loaded: [],
        missing: [],
        pending: []
    };
    const storage = /* @__PURE__ */ Object.create(null);
    icons.sort((a, b)=>{
        if (a.provider !== b.provider) {
            return a.provider.localeCompare(b.provider);
        }
        if (a.prefix !== b.prefix) {
            return a.prefix.localeCompare(b.prefix);
        }
        return a.name.localeCompare(b.name);
    });
    let lastIcon = {
        provider: "",
        prefix: "",
        name: ""
    };
    icons.forEach((icon)=>{
        if (lastIcon.name === icon.name && lastIcon.prefix === icon.prefix && lastIcon.provider === icon.provider) {
            return;
        }
        lastIcon = icon;
        const provider = icon.provider;
        const prefix = icon.prefix;
        const name = icon.name;
        const providerStorage = storage[provider] || (storage[provider] = /* @__PURE__ */ Object.create(null));
        const localStorage = providerStorage[prefix] || (providerStorage[prefix] = getStorage(provider, prefix));
        let list;
        if (name in localStorage.icons) {
            list = result.loaded;
        } else if (prefix === "" || localStorage.missing.has(name)) {
            list = result.missing;
        } else {
            list = result.pending;
        }
        const item = {
            provider,
            prefix,
            name
        };
        list.push(item);
    });
    return result;
}
function removeCallback(storages, id) {
    storages.forEach((storage)=>{
        const items = storage.loaderCallbacks;
        if (items) {
            storage.loaderCallbacks = items.filter((row)=>row.id !== id);
        }
    });
}
function updateCallbacks(storage) {
    if (!storage.pendingCallbacksFlag) {
        storage.pendingCallbacksFlag = true;
        setTimeout(()=>{
            storage.pendingCallbacksFlag = false;
            const items = storage.loaderCallbacks ? storage.loaderCallbacks.slice(0) : [];
            if (!items.length) {
                return;
            }
            let hasPending = false;
            const provider = storage.provider;
            const prefix = storage.prefix;
            items.forEach((item)=>{
                const icons = item.icons;
                const oldLength = icons.pending.length;
                icons.pending = icons.pending.filter((icon)=>{
                    if (icon.prefix !== prefix) {
                        return true;
                    }
                    const name = icon.name;
                    if (storage.icons[name]) {
                        icons.loaded.push({
                            provider,
                            prefix,
                            name
                        });
                    } else if (storage.missing.has(name)) {
                        icons.missing.push({
                            provider,
                            prefix,
                            name
                        });
                    } else {
                        hasPending = true;
                        return true;
                    }
                    return false;
                });
                if (icons.pending.length !== oldLength) {
                    if (!hasPending) {
                        removeCallback([
                            storage
                        ], item.id);
                    }
                    item.callback(icons.loaded.slice(0), icons.missing.slice(0), icons.pending.slice(0), item.abort);
                }
            });
        });
    }
}
let idCounter = 0;
function storeCallback(callback, icons, pendingSources) {
    const id = idCounter++;
    const abort = removeCallback.bind(null, pendingSources, id);
    if (!icons.pending.length) {
        return abort;
    }
    const item = {
        id,
        icons,
        callback,
        abort
    };
    pendingSources.forEach((storage)=>{
        (storage.loaderCallbacks || (storage.loaderCallbacks = [])).push(item);
    });
    return abort;
}
function listToIcons(list, validate = true, simpleNames = false) {
    const result = [];
    list.forEach((item)=>{
        const icon = typeof item === "string" ? stringToIcon(item, validate, simpleNames) : item;
        if (icon) {
            result.push(icon);
        }
    });
    return result;
}
// src/config.ts
var defaultConfig = {
    resources: [],
    index: 0,
    timeout: 2e3,
    rotate: 750,
    random: false,
    dataAfterTimeout: false
};
// src/query.ts
function sendQuery(config, payload, query, done) {
    const resourcesCount = config.resources.length;
    const startIndex = config.random ? Math.floor(Math.random() * resourcesCount) : config.index;
    let resources;
    if (config.random) {
        let list = config.resources.slice(0);
        resources = [];
        while(list.length > 1){
            const nextIndex = Math.floor(Math.random() * list.length);
            resources.push(list[nextIndex]);
            list = list.slice(0, nextIndex).concat(list.slice(nextIndex + 1));
        }
        resources = resources.concat(list);
    } else {
        resources = config.resources.slice(startIndex).concat(config.resources.slice(0, startIndex));
    }
    const startTime = Date.now();
    let status = "pending";
    let queriesSent = 0;
    let lastError;
    let timer = null;
    let queue = [];
    let doneCallbacks = [];
    if (typeof done === "function") {
        doneCallbacks.push(done);
    }
    function resetTimer() {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
    }
    function abort() {
        if (status === "pending") {
            status = "aborted";
        }
        resetTimer();
        queue.forEach((item)=>{
            if (item.status === "pending") {
                item.status = "aborted";
            }
        });
        queue = [];
    }
    function subscribe(callback, overwrite) {
        if (overwrite) {
            doneCallbacks = [];
        }
        if (typeof callback === "function") {
            doneCallbacks.push(callback);
        }
    }
    function getQueryStatus() {
        return {
            startTime,
            payload,
            status,
            queriesSent,
            queriesPending: queue.length,
            subscribe,
            abort
        };
    }
    function failQuery() {
        status = "failed";
        doneCallbacks.forEach((callback)=>{
            callback(void 0, lastError);
        });
    }
    function clearQueue() {
        queue.forEach((item)=>{
            if (item.status === "pending") {
                item.status = "aborted";
            }
        });
        queue = [];
    }
    function moduleResponse(item, response, data) {
        const isError = response !== "success";
        queue = queue.filter((queued)=>queued !== item);
        switch(status){
            case "pending":
                break;
            case "failed":
                if (isError || !config.dataAfterTimeout) {
                    return;
                }
                break;
            default:
                return;
        }
        if (response === "abort") {
            lastError = data;
            failQuery();
            return;
        }
        if (isError) {
            lastError = data;
            if (!queue.length) {
                if (!resources.length) {
                    failQuery();
                } else {
                    execNext();
                }
            }
            return;
        }
        resetTimer();
        clearQueue();
        if (!config.random) {
            const index = config.resources.indexOf(item.resource);
            if (index !== -1 && index !== config.index) {
                config.index = index;
            }
        }
        status = "completed";
        doneCallbacks.forEach((callback)=>{
            callback(data);
        });
    }
    function execNext() {
        if (status !== "pending") {
            return;
        }
        resetTimer();
        const resource = resources.shift();
        if (resource === void 0) {
            if (queue.length) {
                timer = setTimeout(()=>{
                    resetTimer();
                    if (status === "pending") {
                        clearQueue();
                        failQuery();
                    }
                }, config.timeout);
                return;
            }
            failQuery();
            return;
        }
        const item = {
            status: "pending",
            resource,
            callback: (status2, data)=>{
                moduleResponse(item, status2, data);
            }
        };
        queue.push(item);
        queriesSent++;
        timer = setTimeout(execNext, config.rotate);
        query(resource, payload, item.callback);
    }
    setTimeout(execNext);
    return getQueryStatus;
}
// src/index.ts
function initRedundancy(cfg) {
    const config = {
        ...defaultConfig,
        ...cfg
    };
    let queries = [];
    function cleanup() {
        queries = queries.filter((item)=>item().status === "pending");
    }
    function query(payload, queryCallback, doneCallback) {
        const query2 = sendQuery(config, payload, queryCallback, (data, error)=>{
            cleanup();
            if (doneCallback) {
                doneCallback(data, error);
            }
        });
        queries.push(query2);
        return query2;
    }
    function find(callback) {
        return queries.find((value)=>{
            return callback(value);
        }) || null;
    }
    const instance = {
        query,
        find,
        setIndex: (index)=>{
            config.index = index;
        },
        getIndex: ()=>config.index,
        cleanup
    };
    return instance;
}
function emptyCallback$1() {}
const redundancyCache = /* @__PURE__ */ Object.create(null);
function getRedundancyCache(provider) {
    if (!redundancyCache[provider]) {
        const config = getAPIConfig(provider);
        if (!config) {
            return;
        }
        const redundancy = initRedundancy(config);
        const cachedReundancy = {
            config,
            redundancy
        };
        redundancyCache[provider] = cachedReundancy;
    }
    return redundancyCache[provider];
}
function sendAPIQuery(target, query, callback) {
    let redundancy;
    let send;
    if (typeof target === "string") {
        const api = getAPIModule(target);
        if (!api) {
            callback(void 0, 424);
            return emptyCallback$1;
        }
        send = api.send;
        const cached = getRedundancyCache(target);
        if (cached) {
            redundancy = cached.redundancy;
        }
    } else {
        const config = createAPIConfig(target);
        if (config) {
            redundancy = initRedundancy(config);
            const moduleKey = target.resources ? target.resources[0] : "";
            const api = getAPIModule(moduleKey);
            if (api) {
                send = api.send;
            }
        }
    }
    if (!redundancy || !send) {
        callback(void 0, 424);
        return emptyCallback$1;
    }
    return redundancy.query(query, send, callback)().abort;
}
function emptyCallback() {}
function loadedNewIcons(storage) {
    if (!storage.iconsLoaderFlag) {
        storage.iconsLoaderFlag = true;
        setTimeout(()=>{
            storage.iconsLoaderFlag = false;
            updateCallbacks(storage);
        });
    }
}
function checkIconNamesForAPI(icons) {
    const valid = [];
    const invalid = [];
    icons.forEach((name)=>{
        (name.match(matchIconName) ? valid : invalid).push(name);
    });
    return {
        valid,
        invalid
    };
}
function parseLoaderResponse(storage, icons, data) {
    function checkMissing() {
        const pending = storage.pendingIcons;
        icons.forEach((name)=>{
            if (pending) {
                pending.delete(name);
            }
            if (!storage.icons[name]) {
                storage.missing.add(name);
            }
        });
    }
    if (data && typeof data === "object") {
        try {
            const parsed = addIconSet(storage, data);
            if (!parsed.length) {
                checkMissing();
                return;
            }
        } catch (err) {
            console.error(err);
        }
    }
    checkMissing();
    loadedNewIcons(storage);
}
function parsePossiblyAsyncResponse(response, callback) {
    if (response instanceof Promise) {
        response.then((data)=>{
            callback(data);
        }).catch(()=>{
            callback(null);
        });
    } else {
        callback(response);
    }
}
function loadNewIcons(storage, icons) {
    if (!storage.iconsToLoad) {
        storage.iconsToLoad = icons;
    } else {
        storage.iconsToLoad = storage.iconsToLoad.concat(icons).sort();
    }
    if (!storage.iconsQueueFlag) {
        storage.iconsQueueFlag = true;
        setTimeout(()=>{
            storage.iconsQueueFlag = false;
            const { provider, prefix } = storage;
            const icons2 = storage.iconsToLoad;
            delete storage.iconsToLoad;
            if (!icons2 || !icons2.length) {
                return;
            }
            const customIconLoader = storage.loadIcon;
            if (storage.loadIcons && (icons2.length > 1 || !customIconLoader)) {
                parsePossiblyAsyncResponse(storage.loadIcons(icons2, prefix, provider), (data)=>{
                    parseLoaderResponse(storage, icons2, data);
                });
                return;
            }
            if (customIconLoader) {
                icons2.forEach((name)=>{
                    const response = customIconLoader(name, prefix, provider);
                    parsePossiblyAsyncResponse(response, (data)=>{
                        const iconSet = data ? {
                            prefix,
                            icons: {
                                [name]: data
                            }
                        } : null;
                        parseLoaderResponse(storage, [
                            name
                        ], iconSet);
                    });
                });
                return;
            }
            const { valid, invalid } = checkIconNamesForAPI(icons2);
            if (invalid.length) {
                parseLoaderResponse(storage, invalid, null);
            }
            if (!valid.length) {
                return;
            }
            const api = prefix.match(matchIconName) ? getAPIModule(provider) : null;
            if (!api) {
                parseLoaderResponse(storage, valid, null);
                return;
            }
            const params = api.prepare(provider, prefix, valid);
            params.forEach((item)=>{
                sendAPIQuery(provider, item, (data)=>{
                    parseLoaderResponse(storage, item.icons, data);
                });
            });
        });
    }
}
const loadIcons = (icons, callback)=>{
    const cleanedIcons = listToIcons(icons, true, allowSimpleNames());
    const sortedIcons = sortIcons(cleanedIcons);
    if (!sortedIcons.pending.length) {
        let callCallback = true;
        if (callback) {
            setTimeout(()=>{
                if (callCallback) {
                    callback(sortedIcons.loaded, sortedIcons.missing, sortedIcons.pending, emptyCallback);
                }
            });
        }
        return ()=>{
            callCallback = false;
        };
    }
    const newIcons = /* @__PURE__ */ Object.create(null);
    const sources = [];
    let lastProvider, lastPrefix;
    sortedIcons.pending.forEach((icon)=>{
        const { provider, prefix } = icon;
        if (prefix === lastPrefix && provider === lastProvider) {
            return;
        }
        lastProvider = provider;
        lastPrefix = prefix;
        sources.push(getStorage(provider, prefix));
        const providerNewIcons = newIcons[provider] || (newIcons[provider] = /* @__PURE__ */ Object.create(null));
        if (!providerNewIcons[prefix]) {
            providerNewIcons[prefix] = [];
        }
    });
    sortedIcons.pending.forEach((icon)=>{
        const { provider, prefix, name } = icon;
        const storage = getStorage(provider, prefix);
        const pendingQueue = storage.pendingIcons || (storage.pendingIcons = /* @__PURE__ */ new Set());
        if (!pendingQueue.has(name)) {
            pendingQueue.add(name);
            newIcons[provider][prefix].push(name);
        }
    });
    sources.forEach((storage)=>{
        const list = newIcons[storage.provider][storage.prefix];
        if (list.length) {
            loadNewIcons(storage, list);
        }
    });
    return callback ? storeCallback(callback, sortedIcons, sources) : emptyCallback;
};
const loadIcon = (icon)=>{
    return new Promise((fulfill, reject)=>{
        const iconObj = typeof icon === "string" ? stringToIcon(icon, true) : icon;
        if (!iconObj) {
            reject(icon);
            return;
        }
        loadIcons([
            iconObj || icon
        ], (loaded)=>{
            if (loaded.length && iconObj) {
                const data = getIconData(iconObj);
                if (data) {
                    fulfill({
                        ...defaultIconProps,
                        ...data
                    });
                    return;
                }
            }
            reject(icon);
        });
    });
};
function setCustomIconsLoader(loader, prefix, provider) {
    getStorage(provider || "", prefix).loadIcons = loader;
}
function setCustomIconLoader(loader, prefix, provider) {
    getStorage(provider || "", prefix).loadIcon = loader;
}
function mergeCustomisations(defaults, item) {
    const result = {
        ...defaults
    };
    for(const key in item){
        const value = item[key];
        const valueType = typeof value;
        if (key in defaultIconSizeCustomisations) {
            if (value === null || value && (valueType === "string" || valueType === "number")) {
                result[key] = value;
            }
        } else if (valueType === typeof result[key]) {
            result[key] = key === "rotate" ? value % 4 : value;
        }
    }
    return result;
}
const separator = /[\s,]+/;
function flipFromString(custom, flip) {
    flip.split(separator).forEach((str)=>{
        const value = str.trim();
        switch(value){
            case "horizontal":
                custom.hFlip = true;
                break;
            case "vertical":
                custom.vFlip = true;
                break;
        }
    });
}
function rotateFromString(value, defaultValue = 0) {
    const units = value.replace(/^-?[0-9.]*/, "");
    function cleanup(value2) {
        while(value2 < 0){
            value2 += 4;
        }
        return value2 % 4;
    }
    if (units === "") {
        const num = parseInt(value);
        return isNaN(num) ? 0 : cleanup(num);
    } else if (units !== value) {
        let split = 0;
        switch(units){
            case "%":
                split = 25;
                break;
            case "deg":
                split = 90;
        }
        if (split) {
            let num = parseFloat(value.slice(0, value.length - units.length));
            if (isNaN(num)) {
                return 0;
            }
            num = num / split;
            return num % 1 === 0 ? cleanup(num) : 0;
        }
    }
    return defaultValue;
}
function iconToHTML(body, attributes) {
    let renderAttribsHTML = body.indexOf("xlink:") === -1 ? "" : ' xmlns:xlink="http://www.w3.org/1999/xlink"';
    for(const attr in attributes){
        renderAttribsHTML += " " + attr + '="' + attributes[attr] + '"';
    }
    return '<svg xmlns="http://www.w3.org/2000/svg"' + renderAttribsHTML + ">" + body + "</svg>";
}
function encodeSVGforURL(svg) {
    return svg.replace(/"/g, "'").replace(/%/g, "%25").replace(/#/g, "%23").replace(/</g, "%3C").replace(/>/g, "%3E").replace(/\s+/g, " ");
}
function svgToData(svg) {
    return "data:image/svg+xml," + encodeSVGforURL(svg);
}
function svgToURL(svg) {
    return 'url("' + svgToData(svg) + '")';
}
let policy;
function createPolicy() {
    try {
        policy = window.trustedTypes.createPolicy("iconify", {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            createHTML: (s)=>s
        });
    } catch (err) {
        policy = null;
    }
}
function cleanUpInnerHTML(html) {
    if (policy === void 0) {
        createPolicy();
    }
    return policy ? policy.createHTML(html) : html;
}
const defaultExtendedIconCustomisations = {
    ...defaultIconCustomisations,
    inline: false
};
/**
 * Default SVG attributes
 */ const svgDefaults = {
    'xmlns': 'http://www.w3.org/2000/svg',
    'xmlnsXlink': 'http://www.w3.org/1999/xlink',
    'aria-hidden': true,
    'role': 'img'
};
/**
 * Style modes
 */ const commonProps = {
    display: 'inline-block'
};
const monotoneProps = {
    backgroundColor: 'currentColor'
};
const coloredProps = {
    backgroundColor: 'transparent'
};
// Dynamically add common props to variables above
const propsToAdd = {
    Image: 'var(--svg)',
    Repeat: 'no-repeat',
    Size: '100% 100%'
};
const propsToAddTo = {
    WebkitMask: monotoneProps,
    mask: monotoneProps,
    background: coloredProps
};
for(const prefix in propsToAddTo){
    const list = propsToAddTo[prefix];
    for(const prop in propsToAdd){
        list[prefix + prop] = propsToAdd[prop];
    }
}
/**
 * Default values for customisations for inline icon
 */ const inlineDefaults = {
    ...defaultExtendedIconCustomisations,
    inline: true
};
/**
 * Fix size: add 'px' to numbers
 */ function fixSize(value) {
    return value + (value.match(/^[-0-9.]+$/) ? 'px' : '');
}
/**
 * Render icon
 */ const render = (// Icon must be validated before calling this function
icon, // Partial properties
props, // Icon name
name)=>{
    // Get default properties
    const defaultProps = props.inline ? inlineDefaults : defaultExtendedIconCustomisations;
    // Get all customisations
    const customisations = mergeCustomisations(defaultProps, props);
    // Check mode
    const mode = props.mode || 'svg';
    // Create style
    const style = {};
    const customStyle = props.style || {};
    // Create SVG component properties
    const componentProps = {
        ...mode === 'svg' ? svgDefaults : {}
    };
    if (name) {
        const iconName = stringToIcon(name, false, true);
        if (iconName) {
            const classNames = [
                'iconify'
            ];
            const props = [
                'provider',
                'prefix'
            ];
            for (const prop of props){
                if (iconName[prop]) {
                    classNames.push('iconify--' + iconName[prop]);
                }
            }
            componentProps.className = classNames.join(' ');
        }
    }
    // Get element properties
    for(let key in props){
        const value = props[key];
        if (value === void 0) {
            continue;
        }
        switch(key){
            // Properties to ignore
            case 'icon':
            case 'style':
            case 'children':
            case 'onLoad':
            case 'mode':
            case 'ssr':
                break;
            // Forward ref
            case '_ref':
                componentProps.ref = value;
                break;
            // Merge class names
            case 'className':
                componentProps[key] = (componentProps[key] ? componentProps[key] + ' ' : '') + value;
                break;
            // Boolean attributes
            case 'inline':
            case 'hFlip':
            case 'vFlip':
                customisations[key] = value === true || value === 'true' || value === 1;
                break;
            // Flip as string: 'horizontal,vertical'
            case 'flip':
                if (typeof value === 'string') {
                    flipFromString(customisations, value);
                }
                break;
            // Color: copy to style
            case 'color':
                style.color = value;
                break;
            // Rotation as string
            case 'rotate':
                if (typeof value === 'string') {
                    customisations[key] = rotateFromString(value);
                } else if (typeof value === 'number') {
                    customisations[key] = value;
                }
                break;
            // Remove aria-hidden
            case 'ariaHidden':
            case 'aria-hidden':
                if (value !== true && value !== 'true') {
                    delete componentProps['aria-hidden'];
                }
                break;
            // Copy missing property if it does not exist in customisations
            default:
                if (defaultProps[key] === void 0) {
                    componentProps[key] = value;
                }
        }
    }
    // Generate icon
    const item = iconToSVG(icon, customisations);
    const renderAttribs = item.attributes;
    // Inline display
    if (customisations.inline) {
        style.verticalAlign = '-0.125em';
    }
    if (mode === 'svg') {
        // Add style
        componentProps.style = {
            ...style,
            ...customStyle
        };
        // Add icon stuff
        Object.assign(componentProps, renderAttribs);
        // Counter for ids based on "id" property to render icons consistently on server and client
        let localCounter = 0;
        let id = props.id;
        if (typeof id === 'string') {
            // Convert '-' to '_' to avoid errors in animations
            id = id.replace(/-/g, '_');
        }
        // Add icon stuff
        componentProps.dangerouslySetInnerHTML = {
            __html: cleanUpInnerHTML(replaceIDs(item.body, id ? ()=>id + 'ID' + localCounter++ : 'iconifyReact'))
        };
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"])('svg', componentProps);
    }
    // Render <span> with style
    const { body, width, height } = icon;
    const useMask = mode === 'mask' || (mode === 'bg' ? false : body.indexOf('currentColor') !== -1);
    // Generate SVG
    const html = iconToHTML(body, {
        ...renderAttribs,
        width: width + '',
        height: height + ''
    });
    // Generate style
    componentProps.style = {
        ...style,
        '--svg': svgToURL(html),
        'width': fixSize(renderAttribs.width),
        'height': fixSize(renderAttribs.height),
        ...commonProps,
        ...useMask ? monotoneProps : coloredProps,
        ...customStyle
    };
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"])('span', componentProps);
};
/**
 * Initialise stuff
 */ // Enable short names
allowSimpleNames(true);
// Set API module
setAPIModule('', fetchAPIModule);
/**
 * Browser stuff
 */ if (typeof document !== 'undefined' && typeof window !== 'undefined') {
    const _window = window;
    // Load icons from global "IconifyPreload"
    if (_window.IconifyPreload !== void 0) {
        const preload = _window.IconifyPreload;
        const err = 'Invalid IconifyPreload syntax.';
        if (typeof preload === 'object' && preload !== null) {
            (preload instanceof Array ? preload : [
                preload
            ]).forEach((item)=>{
                try {
                    if (// Check if item is an object and not null/array
                    typeof item !== 'object' || item === null || item instanceof Array || // Check for 'icons' and 'prefix'
                    typeof item.icons !== 'object' || typeof item.prefix !== 'string' || // Add icon set
                    !addCollection(item)) {
                        console.error(err);
                    }
                } catch (e) {
                    console.error(err);
                }
            });
        }
    }
    // Set API from global "IconifyProviders"
    if (_window.IconifyProviders !== void 0) {
        const providers = _window.IconifyProviders;
        if (typeof providers === 'object' && providers !== null) {
            for(let key in providers){
                const err = 'IconifyProviders[' + key + '] is invalid.';
                try {
                    const value = providers[key];
                    if (typeof value !== 'object' || !value || value.resources === void 0) {
                        continue;
                    }
                    if (!addAPIProvider(key, value)) {
                        console.error(err);
                    }
                } catch (e) {
                    console.error(err);
                }
            }
        }
    }
}
function IconComponent(props) {
    const [mounted, setMounted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(!!props.ssr);
    const [abort, setAbort] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    // Get initial state
    function getInitialState(mounted) {
        if (mounted) {
            const name = props.icon;
            if (typeof name === 'object') {
                // Icon as object
                return {
                    name: '',
                    data: name
                };
            }
            const data = getIconData(name);
            if (data) {
                return {
                    name,
                    data
                };
            }
        }
        return {
            name: ''
        };
    }
    const [state, setState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(getInitialState(!!props.ssr));
    // Cancel loading
    function cleanup() {
        const callback = abort.callback;
        if (callback) {
            callback();
            setAbort({});
        }
    }
    // Change state if it is different
    function changeState(newState) {
        if (JSON.stringify(state) !== JSON.stringify(newState)) {
            cleanup();
            setState(newState);
            return true;
        }
    }
    // Update state
    function updateState() {
        var _a;
        const name = props.icon;
        if (typeof name === 'object') {
            // Icon as object
            changeState({
                name: '',
                data: name
            });
            return;
        }
        // New icon or got icon data
        const data = getIconData(name);
        if (changeState({
            name,
            data
        })) {
            if (data === undefined) {
                // Load icon, update state when done
                const callback = loadIcons([
                    name
                ], updateState);
                setAbort({
                    callback
                });
            } else if (data) {
                // Icon data is available: trigger onLoad callback if present
                (_a = props.onLoad) === null || _a === void 0 ? void 0 : _a.call(props, name);
            }
        }
    }
    // Mounted state, cleanup for loader
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "IconComponent.useEffect": ()=>{
            setMounted(true);
            return cleanup;
        }
    }["IconComponent.useEffect"], []);
    // Icon changed or component mounted
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "IconComponent.useEffect": ()=>{
            if (mounted) {
                updateState();
            }
        }
    }["IconComponent.useEffect"], [
        props.icon,
        mounted
    ]);
    // Render icon
    const { name, data } = state;
    if (!data) {
        return props.children ? props.children : props.fallback ? props.fallback : (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"])('span', {});
    }
    return render({
        ...defaultIconProps,
        ...data
    }, props, name);
}
/**
 * Block icon
 *
 * @param props - Component properties
 */ const Icon = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])((props, ref)=>IconComponent({
        ...props,
        _ref: ref
    }));
/**
 * Inline icon (has negative verticalAlign that makes it behave like icon font)
 *
 * @param props - Component properties
 */ const InlineIcon = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])((props, ref)=>IconComponent({
        inline: true,
        ...props,
        _ref: ref
    }));
/**
 * Internal API
 */ const _api = {
    getAPIConfig,
    setAPIModule,
    sendAPIQuery,
    setFetch,
    getFetch,
    listAPIProviders
};
;
}),
"[project]/node_modules/framer-motion/dist/es/components/AnimatePresence/PopChild.mjs [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "PopChild": (()=>PopChild)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/compiled/react/jsx-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2d$dom$2f$dist$2f$es$2f$utils$2f$is$2d$html$2d$element$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/motion-dom/dist/es/utils/is-html-element.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$context$2f$MotionConfigContext$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/context/MotionConfigContext.mjs [app-client] (ecmascript)");
"use client";
;
;
;
;
;
/**
 * Measurement functionality has to be within a separate component
 * to leverage snapshot lifecycle.
 */ class PopChildMeasure extends __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Component"] {
    getSnapshotBeforeUpdate(prevProps) {
        const element = this.props.childRef.current;
        if (element && prevProps.isPresent && !this.props.isPresent) {
            const parent = element.offsetParent;
            const parentWidth = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2d$dom$2f$dist$2f$es$2f$utils$2f$is$2d$html$2d$element$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isHTMLElement"])(parent) ? parent.offsetWidth || 0 : 0;
            const size = this.props.sizeRef.current;
            size.height = element.offsetHeight || 0;
            size.width = element.offsetWidth || 0;
            size.top = element.offsetTop;
            size.left = element.offsetLeft;
            size.right = parentWidth - size.width - size.left;
        }
        return null;
    }
    /**
     * Required with getSnapshotBeforeUpdate to stop React complaining.
     */ componentDidUpdate() {}
    render() {
        return this.props.children;
    }
}
function PopChild({ children, isPresent, anchorX }) {
    const id = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useId"])();
    const ref = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const size = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])({
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        right: 0
    });
    const { nonce } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$context$2f$MotionConfigContext$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MotionConfigContext"]);
    /**
     * We create and inject a style block so we can apply this explicit
     * sizing in a non-destructive manner by just deleting the style block.
     *
     * We can't apply size via render as the measurement happens
     * in getSnapshotBeforeUpdate (post-render), likewise if we apply the
     * styles directly on the DOM node, we might be overwriting
     * styles set via the style prop.
     */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useInsertionEffect"])({
        "PopChild.useInsertionEffect": ()=>{
            const { width, height, top, left, right } = size.current;
            if (isPresent || !ref.current || !width || !height) return;
            const x = anchorX === "left" ? `left: ${left}` : `right: ${right}`;
            ref.current.dataset.motionPopId = id;
            const style = document.createElement("style");
            if (nonce) style.nonce = nonce;
            document.head.appendChild(style);
            if (style.sheet) {
                style.sheet.insertRule(`
          [data-motion-pop-id="${id}"] {
            position: absolute !important;
            width: ${width}px !important;
            height: ${height}px !important;
            ${x}px !important;
            top: ${top}px !important;
          }
        `);
            }
            return ({
                "PopChild.useInsertionEffect": ()=>{
                    if (document.head.contains(style)) {
                        document.head.removeChild(style);
                    }
                }
            })["PopChild.useInsertionEffect"];
        }
    }["PopChild.useInsertionEffect"], [
        isPresent
    ]);
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsx"])(PopChildMeasure, {
        isPresent: isPresent,
        childRef: ref,
        sizeRef: size,
        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cloneElement"])(children, {
            ref
        })
    });
}
;
}),
"[project]/node_modules/framer-motion/dist/es/components/AnimatePresence/PresenceChild.mjs [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "PresenceChild": (()=>PresenceChild)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/compiled/react/jsx-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$context$2f$PresenceContext$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/context/PresenceContext.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$utils$2f$use$2d$constant$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/utils/use-constant.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$PopChild$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/components/AnimatePresence/PopChild.mjs [app-client] (ecmascript)");
"use client";
;
;
;
;
;
;
const PresenceChild = ({ children, initial, isPresent, onExitComplete, custom, presenceAffectsLayout, mode, anchorX })=>{
    const presenceChildren = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$utils$2f$use$2d$constant$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useConstant"])(newChildrenMap);
    const id = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useId"])();
    let isReusedContext = true;
    let context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "PresenceChild.useMemo[context]": ()=>{
            isReusedContext = false;
            return {
                id,
                initial,
                isPresent,
                custom,
                onExitComplete: ({
                    "PresenceChild.useMemo[context]": (childId)=>{
                        presenceChildren.set(childId, true);
                        for (const isComplete of presenceChildren.values()){
                            if (!isComplete) return; // can stop searching when any is incomplete
                        }
                        onExitComplete && onExitComplete();
                    }
                })["PresenceChild.useMemo[context]"],
                register: ({
                    "PresenceChild.useMemo[context]": (childId)=>{
                        presenceChildren.set(childId, false);
                        return ({
                            "PresenceChild.useMemo[context]": ()=>presenceChildren.delete(childId)
                        })["PresenceChild.useMemo[context]"];
                    }
                })["PresenceChild.useMemo[context]"]
            };
        }
    }["PresenceChild.useMemo[context]"], [
        isPresent,
        presenceChildren,
        onExitComplete
    ]);
    /**
     * If the presence of a child affects the layout of the components around it,
     * we want to make a new context value to ensure they get re-rendered
     * so they can detect that layout change.
     */ if (presenceAffectsLayout && isReusedContext) {
        context = {
            ...context
        };
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "PresenceChild.useMemo": ()=>{
            presenceChildren.forEach({
                "PresenceChild.useMemo": (_, key)=>presenceChildren.set(key, false)
            }["PresenceChild.useMemo"]);
        }
    }["PresenceChild.useMemo"], [
        isPresent
    ]);
    /**
     * If there's no `motion` components to fire exit animations, we want to remove this
     * component immediately.
     */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "PresenceChild.useEffect": ()=>{
            !isPresent && !presenceChildren.size && onExitComplete && onExitComplete();
        }
    }["PresenceChild.useEffect"], [
        isPresent
    ]);
    if (mode === "popLayout") {
        children = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsx"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$PopChild$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PopChild"], {
            isPresent: isPresent,
            anchorX: anchorX,
            children: children
        });
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsx"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$context$2f$PresenceContext$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PresenceContext"].Provider, {
        value: context,
        children: children
    });
};
function newChildrenMap() {
    return new Map();
}
;
}),
"[project]/node_modules/framer-motion/dist/es/components/AnimatePresence/utils.mjs [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "getChildKey": (()=>getChildKey),
    "onlyElements": (()=>onlyElements)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
const getChildKey = (child)=>child.key || "";
function onlyElements(children) {
    const filtered = [];
    // We use forEach here instead of map as map mutates the component key by preprending `.$`
    __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Children"].forEach(children, (child)=>{
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidElement"])(child)) filtered.push(child);
    });
    return filtered;
}
;
}),
"[project]/node_modules/framer-motion/dist/es/components/AnimatePresence/index.mjs [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "AnimatePresence": (()=>AnimatePresence)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/compiled/react/jsx-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$context$2f$LayoutGroupContext$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/context/LayoutGroupContext.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$utils$2f$use$2d$constant$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/utils/use-constant.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$utils$2f$use$2d$isomorphic$2d$effect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/utils/use-isomorphic-effect.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$PresenceChild$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/components/AnimatePresence/PresenceChild.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$use$2d$presence$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/components/AnimatePresence/use-presence.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$utils$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/components/AnimatePresence/utils.mjs [app-client] (ecmascript)");
"use client";
;
;
;
;
;
;
;
;
/**
 * `AnimatePresence` enables the animation of components that have been removed from the tree.
 *
 * When adding/removing more than a single child, every child **must** be given a unique `key` prop.
 *
 * Any `motion` components that have an `exit` property defined will animate out when removed from
 * the tree.
 *
 * ```jsx
 * import { motion, AnimatePresence } from 'framer-motion'
 *
 * export const Items = ({ items }) => (
 *   <AnimatePresence>
 *     {items.map(item => (
 *       <motion.div
 *         key={item.id}
 *         initial={{ opacity: 0 }}
 *         animate={{ opacity: 1 }}
 *         exit={{ opacity: 0 }}
 *       />
 *     ))}
 *   </AnimatePresence>
 * )
 * ```
 *
 * You can sequence exit animations throughout a tree using variants.
 *
 * If a child contains multiple `motion` components with `exit` props, it will only unmount the child
 * once all `motion` components have finished animating out. Likewise, any components using
 * `usePresence` all need to call `safeToRemove`.
 *
 * @public
 */ const AnimatePresence = ({ children, custom, initial = true, onExitComplete, presenceAffectsLayout = true, mode = "sync", propagate = false, anchorX = "left" })=>{
    const [isParentPresent, safeToRemove] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$use$2d$presence$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePresence"])(propagate);
    /**
     * Filter any children that aren't ReactElements. We can only track components
     * between renders with a props.key.
     */ const presentChildren = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "AnimatePresence.useMemo[presentChildren]": ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$utils$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["onlyElements"])(children)
    }["AnimatePresence.useMemo[presentChildren]"], [
        children
    ]);
    /**
     * Track the keys of the currently rendered children. This is used to
     * determine which children are exiting.
     */ const presentKeys = propagate && !isParentPresent ? [] : presentChildren.map(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$utils$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getChildKey"]);
    /**
     * If `initial={false}` we only want to pass this to components in the first render.
     */ const isInitialRender = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(true);
    /**
     * A ref containing the currently present children. When all exit animations
     * are complete, we use this to re-render the component with the latest children
     * *committed* rather than the latest children *rendered*.
     */ const pendingPresentChildren = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(presentChildren);
    /**
     * Track which exiting children have finished animating out.
     */ const exitComplete = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$utils$2f$use$2d$constant$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useConstant"])({
        "AnimatePresence.useConstant[exitComplete]": ()=>new Map()
    }["AnimatePresence.useConstant[exitComplete]"]);
    /**
     * Save children to render as React state. To ensure this component is concurrent-safe,
     * we check for exiting children via an effect.
     */ const [diffedChildren, setDiffedChildren] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(presentChildren);
    const [renderedChildren, setRenderedChildren] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(presentChildren);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$utils$2f$use$2d$isomorphic$2d$effect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useIsomorphicLayoutEffect"])({
        "AnimatePresence.useIsomorphicLayoutEffect": ()=>{
            isInitialRender.current = false;
            pendingPresentChildren.current = presentChildren;
            /**
         * Update complete status of exiting children.
         */ for(let i = 0; i < renderedChildren.length; i++){
                const key = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$utils$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getChildKey"])(renderedChildren[i]);
                if (!presentKeys.includes(key)) {
                    if (exitComplete.get(key) !== true) {
                        exitComplete.set(key, false);
                    }
                } else {
                    exitComplete.delete(key);
                }
            }
        }
    }["AnimatePresence.useIsomorphicLayoutEffect"], [
        renderedChildren,
        presentKeys.length,
        presentKeys.join("-")
    ]);
    const exitingChildren = [];
    if (presentChildren !== diffedChildren) {
        let nextChildren = [
            ...presentChildren
        ];
        /**
         * Loop through all the currently rendered components and decide which
         * are exiting.
         */ for(let i = 0; i < renderedChildren.length; i++){
            const child = renderedChildren[i];
            const key = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$utils$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getChildKey"])(child);
            if (!presentKeys.includes(key)) {
                nextChildren.splice(i, 0, child);
                exitingChildren.push(child);
            }
        }
        /**
         * If we're in "wait" mode, and we have exiting children, we want to
         * only render these until they've all exited.
         */ if (mode === "wait" && exitingChildren.length) {
            nextChildren = exitingChildren;
        }
        setRenderedChildren((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$utils$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["onlyElements"])(nextChildren));
        setDiffedChildren(presentChildren);
        /**
         * Early return to ensure once we've set state with the latest diffed
         * children, we can immediately re-render.
         */ return null;
    }
    if (("TURBOPACK compile-time value", "development") !== "production" && mode === "wait" && renderedChildren.length > 1) {
        console.warn(`You're attempting to animate multiple children within AnimatePresence, but its mode is set to "wait". This will lead to odd visual behaviour.`);
    }
    /**
     * If we've been provided a forceRender function by the LayoutGroupContext,
     * we can use it to force a re-render amongst all surrounding components once
     * all components have finished animating out.
     */ const { forceRender } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$context$2f$LayoutGroupContext$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LayoutGroupContext"]);
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsx"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: renderedChildren.map((child)=>{
            const key = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$utils$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getChildKey"])(child);
            const isPresent = propagate && !isParentPresent ? false : presentChildren === renderedChildren || presentKeys.includes(key);
            const onExit = ()=>{
                if (exitComplete.has(key)) {
                    exitComplete.set(key, true);
                } else {
                    return;
                }
                let isEveryExitComplete = true;
                exitComplete.forEach((isExitComplete)=>{
                    if (!isExitComplete) isEveryExitComplete = false;
                });
                if (isEveryExitComplete) {
                    forceRender?.();
                    setRenderedChildren(pendingPresentChildren.current);
                    propagate && safeToRemove?.();
                    onExitComplete && onExitComplete();
                }
            };
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsx"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$PresenceChild$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PresenceChild"], {
                isPresent: isPresent,
                initial: !isInitialRender.current || initial ? undefined : false,
                custom: custom,
                presenceAffectsLayout: presenceAffectsLayout,
                mode: mode,
                onExitComplete: isPresent ? undefined : onExit,
                anchorX: anchorX,
                children: child
            }, key);
        })
    });
};
;
}),
"[project]/frontend/node_modules/lucide-react/dist/esm/icons/check-circle.mjs [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

/**
 * lucide-react v0.0.1 - ISC
 */ __turbopack_context__.s({
    "default": (()=>CheckCircle)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)");
;
const CheckCircle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("CheckCircle", [
    [
        "path",
        {
            d: "M22 11.08V12a10 10 0 1 1-5.93-9.14",
            key: "g774vq"
        }
    ],
    [
        "polyline",
        {
            points: "22 4 12 14.01 9 11.01",
            key: "6xbx8j"
        }
    ]
]);
;
 //# sourceMappingURL=check-circle.mjs.map
}),
"[project]/frontend/node_modules/lucide-react/dist/esm/icons/check-circle.mjs [app-client] (ecmascript) <export default as CheckCircle>": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "CheckCircle": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2d$circle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2d$circle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/icons/check-circle.mjs [app-client] (ecmascript)");
}),
"[project]/frontend/node_modules/lucide-react/dist/esm/icons/info.mjs [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

/**
 * lucide-react v0.0.1 - ISC
 */ __turbopack_context__.s({
    "default": (()=>Info)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)");
;
const Info = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("Info", [
    [
        "circle",
        {
            cx: "12",
            cy: "12",
            r: "10",
            key: "1mglay"
        }
    ],
    [
        "path",
        {
            d: "M12 16v-4",
            key: "1dtifu"
        }
    ],
    [
        "path",
        {
            d: "M12 8h.01",
            key: "e9boi3"
        }
    ]
]);
;
 //# sourceMappingURL=info.mjs.map
}),
"[project]/frontend/node_modules/lucide-react/dist/esm/icons/info.mjs [app-client] (ecmascript) <export default as Info>": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "Info": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$info$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$info$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/icons/info.mjs [app-client] (ecmascript)");
}),
"[project]/frontend/node_modules/lucide-react/dist/esm/icons/clock.mjs [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

/**
 * lucide-react v0.0.1 - ISC
 */ __turbopack_context__.s({
    "default": (()=>Clock)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)");
;
const Clock = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("Clock", [
    [
        "circle",
        {
            cx: "12",
            cy: "12",
            r: "10",
            key: "1mglay"
        }
    ],
    [
        "polyline",
        {
            points: "12 6 12 12 16 14",
            key: "68esgv"
        }
    ]
]);
;
 //# sourceMappingURL=clock.mjs.map
}),
"[project]/frontend/node_modules/lucide-react/dist/esm/icons/clock.mjs [app-client] (ecmascript) <export default as Clock>": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "Clock": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/icons/clock.mjs [app-client] (ecmascript)");
}),
"[project]/frontend/node_modules/lucide-react/dist/esm/icons/map-pin.mjs [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

/**
 * lucide-react v0.0.1 - ISC
 */ __turbopack_context__.s({
    "default": (()=>MapPin)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)");
;
const MapPin = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("MapPin", [
    [
        "path",
        {
            d: "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z",
            key: "2oe9fu"
        }
    ],
    [
        "circle",
        {
            cx: "12",
            cy: "10",
            r: "3",
            key: "ilqhr7"
        }
    ]
]);
;
 //# sourceMappingURL=map-pin.mjs.map
}),
"[project]/frontend/node_modules/lucide-react/dist/esm/icons/map-pin.mjs [app-client] (ecmascript) <export default as MapPin>": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "MapPin": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/icons/map-pin.mjs [app-client] (ecmascript)");
}),
"[project]/frontend/node_modules/lucide-react/dist/esm/icons/users.mjs [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

/**
 * lucide-react v0.0.1 - ISC
 */ __turbopack_context__.s({
    "default": (()=>Users)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)");
;
const Users = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("Users", [
    [
        "path",
        {
            d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
            key: "1yyitq"
        }
    ],
    [
        "circle",
        {
            cx: "9",
            cy: "7",
            r: "4",
            key: "nufk8"
        }
    ],
    [
        "path",
        {
            d: "M22 21v-2a4 4 0 0 0-3-3.87",
            key: "kshegd"
        }
    ],
    [
        "path",
        {
            d: "M16 3.13a4 4 0 0 1 0 7.75",
            key: "1da9ce"
        }
    ]
]);
;
 //# sourceMappingURL=users.mjs.map
}),
"[project]/frontend/node_modules/lucide-react/dist/esm/icons/users.mjs [app-client] (ecmascript) <export default as Users>": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "Users": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/icons/users.mjs [app-client] (ecmascript)");
}),
"[project]/frontend/node_modules/lucide-react/dist/esm/icons/settings.mjs [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

/**
 * lucide-react v0.0.1 - ISC
 */ __turbopack_context__.s({
    "default": (()=>Settings)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)");
;
const Settings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("Settings", [
    [
        "path",
        {
            d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",
            key: "1qme2f"
        }
    ],
    [
        "circle",
        {
            cx: "12",
            cy: "12",
            r: "3",
            key: "1v7zrd"
        }
    ]
]);
;
 //# sourceMappingURL=settings.mjs.map
}),
"[project]/frontend/node_modules/lucide-react/dist/esm/icons/settings.mjs [app-client] (ecmascript) <export default as Settings>": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "Settings": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/icons/settings.mjs [app-client] (ecmascript)");
}),
}]);

//# sourceMappingURL=_2f39e268._.js.map