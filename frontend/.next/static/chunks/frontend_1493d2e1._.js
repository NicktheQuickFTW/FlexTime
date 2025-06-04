(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/frontend/src/utils/logoUtils.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/**
 * FlexTime Logo Utilities
 * Provides easy access to all logos with proper mapping to HELiiX school IDs
 */ // Logo base paths (Next.js public directory)
__turbopack_context__.s({
    "ALL_TEAM_IDS": (()=>ALL_TEAM_IDS),
    "BIG12_LOGOS": (()=>BIG12_LOGOS),
    "FLEXTIME_LOGOS": (()=>FLEXTIME_LOGOS),
    "TEAM_LOGOS": (()=>TEAM_LOGOS),
    "TEAM_URL_MAPPING": (()=>TEAM_URL_MAPPING),
    "getBig12Logo": (()=>getBig12Logo),
    "getFlexTimeLogo": (()=>getFlexTimeLogo),
    "getTeamIdFromUrl": (()=>getTeamIdFromUrl),
    "getTeamLogo": (()=>getTeamLogo),
    "getTeamName": (()=>getTeamName),
    "getThemedBig12Logo": (()=>getThemedBig12Logo),
    "getThemedFlexTimeLogo": (()=>getThemedFlexTimeLogo),
    "getThemedLogo": (()=>getThemedLogo)
});
const LOGO_BASE_PATH = '/logos';
const TEAMS_PATH = `${LOGO_BASE_PATH}/teams`;
const FLEXTIME_PATH = `${LOGO_BASE_PATH}/flextime`;
const CONFERENCE_PATH = `${LOGO_BASE_PATH}/conferences`;
const FLEXTIME_LOGOS = {
    black: `${FLEXTIME_PATH}/flextime-black.jpg`,
    white: `${FLEXTIME_PATH}/flextime-white.jpg`,
    dark: `${FLEXTIME_PATH}/flextime-dark.svg`,
    light: `${FLEXTIME_PATH}/flextime-light.svg`,
    svg: {
        black: {
            large: `${FLEXTIME_PATH}/flextime-black1028x1028.svg`,
            small: `${FLEXTIME_PATH}/flextime-black240x240.svg`
        },
        white: {
            large: `${FLEXTIME_PATH}/flextime-white1028x1028.svg`,
            small: `${FLEXTIME_PATH}/flextime-white240x240.svg`
        }
    }
};
const BIG12_LOGOS = {
    primary: `${CONFERENCE_PATH}/big_12_primary.svg`,
    black: `${CONFERENCE_PATH}/big_12_primary_black.svg`,
    white: `${CONFERENCE_PATH}/big_12_primary_white.svg`,
    reversed: `${CONFERENCE_PATH}/big_12_primary_reversed.svg`
};
const TEAM_LOGOS = {
    1: {
        default: `${TEAMS_PATH}/arizona.svg`,
        dark: `${TEAMS_PATH}/dark/arizona-dark.svg`,
        light: `${TEAMS_PATH}/light/arizona-light.svg`,
        name: 'Arizona Wildcats'
    },
    2: {
        default: `${TEAMS_PATH}/arizona_state.svg`,
        dark: `${TEAMS_PATH}/dark/arizona_state-dark.svg`,
        light: `${TEAMS_PATH}/light/arizona_state-light.svg`,
        name: 'Arizona State Sun Devils'
    },
    3: {
        default: `${TEAMS_PATH}/baylor.svg`,
        dark: `${TEAMS_PATH}/dark/baylor-dark.svg`,
        light: `${TEAMS_PATH}/light/baylor-light.svg`,
        name: 'Baylor Bears'
    },
    4: {
        default: `${TEAMS_PATH}/byu.svg`,
        dark: `${TEAMS_PATH}/dark/byu-dark.svg`,
        light: `${TEAMS_PATH}/light/byu-light.svg`,
        name: 'BYU Cougars'
    },
    5: {
        default: `${TEAMS_PATH}/ucf.svg`,
        dark: `${TEAMS_PATH}/dark/ucf-dark.svg`,
        light: `${TEAMS_PATH}/light/ucf-light.svg`,
        name: 'UCF Knights'
    },
    6: {
        default: `${TEAMS_PATH}/cincinnati.svg`,
        dark: `${TEAMS_PATH}/dark/cincinnati-dark.svg`,
        light: `${TEAMS_PATH}/light/cincinnati-light.svg`,
        name: 'Cincinnati Bearcats'
    },
    7: {
        default: `${TEAMS_PATH}/colorado.svg`,
        dark: `${TEAMS_PATH}/dark/colorado-dark.svg`,
        light: `${TEAMS_PATH}/light/colorado-light.svg`,
        name: 'Colorado Buffaloes'
    },
    8: {
        default: `${TEAMS_PATH}/houston.svg`,
        dark: `${TEAMS_PATH}/dark/houston-dark.svg`,
        light: `${TEAMS_PATH}/light/houston-light.svg`,
        name: 'Houston Cougars'
    },
    9: {
        default: `${TEAMS_PATH}/iowa_state.svg`,
        dark: `${TEAMS_PATH}/dark/iowa_state-dark.svg`,
        light: `${TEAMS_PATH}/light/iowa_state-light.svg`,
        name: 'Iowa State Cyclones'
    },
    10: {
        default: `${TEAMS_PATH}/kansas.svg`,
        dark: `${TEAMS_PATH}/dark/kansas-dark.svg`,
        light: `${TEAMS_PATH}/light/kansas-light.svg`,
        name: 'Kansas Jayhawks'
    },
    11: {
        default: `${TEAMS_PATH}/kansas_state.svg`,
        dark: `${TEAMS_PATH}/dark/kansas_state-dark.svg`,
        light: `${TEAMS_PATH}/light/kansas_state-light.svg`,
        name: 'Kansas State Wildcats'
    },
    12: {
        default: `${TEAMS_PATH}/oklahoma_state.svg`,
        dark: `${TEAMS_PATH}/dark/oklahoma_state-dark.svg`,
        light: `${TEAMS_PATH}/light/oklahoma_state-light.svg`,
        name: 'Oklahoma State Cowboys'
    },
    13: {
        default: `${TEAMS_PATH}/tcu.svg`,
        dark: `${TEAMS_PATH}/dark/tcu-dark.svg`,
        light: `${TEAMS_PATH}/light/tcu-light.svg`,
        name: 'TCU Horned Frogs'
    },
    14: {
        default: `${TEAMS_PATH}/texas_tech.svg`,
        dark: `${TEAMS_PATH}/dark/texas_tech-dark.svg`,
        light: `${TEAMS_PATH}/light/texas_tech-light.svg`,
        name: 'Texas Tech Red Raiders'
    },
    15: {
        default: `${TEAMS_PATH}/utah.svg`,
        dark: `${TEAMS_PATH}/dark/utah-dark.svg`,
        light: `${TEAMS_PATH}/light/utah-light.svg`,
        name: 'Utah Utes'
    },
    16: {
        default: `${TEAMS_PATH}/west_virginia.svg`,
        dark: `${TEAMS_PATH}/dark/west_virginia-dark.svg`,
        light: `${TEAMS_PATH}/light/west_virginia-light.svg`,
        name: 'West Virginia Mountaineers'
    }
};
const getTeamLogo = (schoolId, variant = 'default')=>{
    const team = TEAM_LOGOS[schoolId];
    return team ? team[variant] : null;
};
const getTeamName = (schoolId)=>{
    const team = TEAM_LOGOS[schoolId];
    return team ? team.name : null;
};
const getFlexTimeLogo = (variant = 'dark')=>{
    return FLEXTIME_LOGOS[variant];
};
const getBig12Logo = (variant = 'primary')=>{
    return BIG12_LOGOS[variant];
};
const getThemedLogo = (schoolId, isDarkTheme = true)=>{
    return getTeamLogo(schoolId, isDarkTheme ? 'dark' : 'light');
};
const getThemedFlexTimeLogo = (isDarkTheme = true)=>{
    return getFlexTimeLogo(isDarkTheme ? 'dark' : 'light');
};
const getThemedBig12Logo = (isDarkTheme = true)=>{
    return getBig12Logo(isDarkTheme ? 'white' : 'black');
};
const ALL_TEAM_IDS = Object.keys(TEAM_LOGOS).map(Number);
_c = ALL_TEAM_IDS;
const TEAM_URL_MAPPING = {
    'arizona': 1,
    'arizona-state': 2,
    'baylor': 3,
    'byu': 4,
    'ucf': 5,
    'cincinnati': 6,
    'colorado': 7,
    'houston': 8,
    'iowa-state': 9,
    'kansas': 10,
    'kansas-state': 11,
    'oklahoma-state': 12,
    'tcu': 13,
    'texas-tech': 14,
    'utah': 15,
    'west-virginia': 16
};
const getTeamIdFromUrl = (urlName)=>{
    return TEAM_URL_MAPPING[urlName] || null;
};
var _c;
__turbopack_context__.k.register(_c, "ALL_TEAM_IDS");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/frontend/app/universities/page.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>UniversitiesIndexPage)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$utils$2f$logoUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/utils/logoUtils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/image.js [app-client] (ecmascript)");
'use client';
;
;
;
function UniversitiesIndexPage() {
    const schools = [
        {
            name: 'University of Arizona',
            id: 1,
            url: 'arizona',
            mascot: 'Wildcats',
            colors: [
                '#AB0520',
                '#0C234B'
            ]
        },
        {
            name: 'Arizona State University',
            id: 2,
            url: 'arizona-state',
            mascot: 'Sun Devils',
            colors: [
                '#8C1D40',
                '#FFC627'
            ]
        },
        {
            name: 'Baylor University',
            id: 3,
            url: 'baylor',
            mascot: 'Bears',
            colors: [
                '#154734',
                '#FFD100'
            ]
        },
        {
            name: 'Brigham Young University',
            id: 4,
            url: 'byu',
            mascot: 'Cougars',
            colors: [
                '#002E5D',
                '#FFFFFF'
            ]
        },
        {
            name: 'University of Central Florida',
            id: 5,
            url: 'ucf',
            mascot: 'Knights',
            colors: [
                '#BA9B37',
                '#000000'
            ]
        },
        {
            name: 'University of Cincinnati',
            id: 6,
            url: 'cincinnati',
            mascot: 'Bearcats',
            colors: [
                '#E00122',
                '#000000'
            ]
        },
        {
            name: 'University of Colorado Boulder',
            id: 7,
            url: 'colorado',
            mascot: 'Buffaloes',
            colors: [
                '#CFB87C',
                '#000000'
            ]
        },
        {
            name: 'University of Houston',
            id: 8,
            url: 'houston',
            mascot: 'Cougars',
            colors: [
                '#C8102E',
                '#FFFFFF'
            ]
        },
        {
            name: 'Iowa State University',
            id: 9,
            url: 'iowa-state',
            mascot: 'Cyclones',
            colors: [
                '#C8102E',
                '#F1BE48'
            ]
        },
        {
            name: 'University of Kansas',
            id: 10,
            url: 'kansas',
            mascot: 'Jayhawks',
            colors: [
                '#0051BA',
                '#E8000D'
            ]
        },
        {
            name: 'Kansas State University',
            id: 11,
            url: 'kansas-state',
            mascot: 'Wildcats',
            colors: [
                '#512888',
                '#FFFFFF'
            ]
        },
        {
            name: 'Oklahoma State University',
            id: 12,
            url: 'oklahoma-state',
            mascot: 'Cowboys',
            colors: [
                '#FF7300',
                '#000000'
            ]
        },
        {
            name: 'Texas Christian University',
            id: 13,
            url: 'tcu',
            mascot: 'Horned Frogs',
            colors: [
                '#4D1979',
                '#FFFFFF'
            ]
        },
        {
            name: 'Texas Tech University',
            id: 14,
            url: 'texas-tech',
            mascot: 'Red Raiders',
            colors: [
                '#CC0000',
                '#000000'
            ]
        },
        {
            name: 'University of Utah',
            id: 15,
            url: 'utah',
            mascot: 'Utes',
            colors: [
                '#CC0000',
                '#FFFFFF'
            ]
        },
        {
            name: 'West Virginia University',
            id: 16,
            url: 'west-virginia',
            mascot: 'Mountaineers',
            colors: [
                '#EAAA00',
                '#002855'
            ]
        }
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950 text-white",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "container mx-auto px-6 py-12",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-center mb-16",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                            className: "text-6xl md:text-7xl font-bold mb-6 tracking-tight",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent",
                                children: "Big 12 Universities"
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/universities/page.tsx",
                                lineNumber: 31,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/frontend/app/universities/page.tsx",
                            lineNumber: 30,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-xl text-slate-400 mb-8 max-w-3xl mx-auto",
                            children: "Explore all 16 member universities in the Big 12 Conference"
                        }, void 0, false, {
                            fileName: "[project]/frontend/app/universities/page.tsx",
                            lineNumber: 35,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/app/universities/page.tsx",
                    lineNumber: 29,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
                    children: schools.map((school)=>{
                        const logoSrc = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$utils$2f$logoUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getTeamLogo"])(school.id, 'dark');
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                            href: `/universities/${school.url}`,
                            className: "backdrop-blur-xl bg-white/5 border border-slate-800 hover:border-cyan-500/30 rounded-lg p-6 h-full transition-all duration-300 group cursor-pointer",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center mb-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "w-12 h-12 mr-3 flex items-center justify-center relative",
                                            children: logoSrc ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                src: logoSrc,
                                                alt: `${school.name} logo`,
                                                width: 48,
                                                height: 48,
                                                className: "object-contain"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/app/universities/page.tsx",
                                                lineNumber: 52,
                                                columnNumber: 23
                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg",
                                                style: {
                                                    backgroundColor: school.colors[0]
                                                },
                                                children: [
                                                    school.name.split(' ')[0][0],
                                                    school.name.split(' ')[school.name.split(' ').length - 1][0]
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/app/universities/page.tsx",
                                                lineNumber: 60,
                                                columnNumber: 23
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/app/universities/page.tsx",
                                            lineNumber: 50,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                    className: "text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors",
                                                    children: school.name.replace('University of ', '').replace(' University', '')
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/universities/page.tsx",
                                                    lineNumber: 69,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-sm text-slate-400",
                                                    children: [
                                                        "School ID: ",
                                                        school.id
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend/app/universities/page.tsx",
                                                    lineNumber: 72,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/app/universities/page.tsx",
                                            lineNumber: 68,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/app/universities/page.tsx",
                                    lineNumber: 49,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-slate-400 text-sm leading-relaxed group-hover:text-slate-300 transition-colors mb-2",
                                    children: school.mascot
                                }, void 0, false, {
                                    fileName: "[project]/frontend/app/universities/page.tsx",
                                    lineNumber: 75,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all duration-300",
                                    children: "→"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/app/universities/page.tsx",
                                    lineNumber: 78,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, school.id, true, {
                            fileName: "[project]/frontend/app/universities/page.tsx",
                            lineNumber: 44,
                            columnNumber: 15
                        }, this);
                    })
                }, void 0, false, {
                    fileName: "[project]/frontend/app/universities/page.tsx",
                    lineNumber: 40,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/app/universities/page.tsx",
            lineNumber: 28,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/app/universities/page.tsx",
        lineNumber: 27,
        columnNumber: 5
    }, this);
}
_c = UniversitiesIndexPage;
var _c;
__turbopack_context__.k.register(_c, "UniversitiesIndexPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=frontend_1493d2e1._.js.map