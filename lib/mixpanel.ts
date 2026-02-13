import mixpanel from 'mixpanel-browser';

// Initialize Mixpanel
const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || '';
console.log(
    'Initializing Mixpanel with token:',
    MIXPANEL_TOKEN ? 'Token exists' : 'No token found'
);

mixpanel.init(MIXPANEL_TOKEN, {
    debug: process.env.NODE_ENV === 'development',
    track_pageview: true,
    persistence: 'localStorage',
});

// List of internal user emails
const INTERNAL_USERS = [
    // Add your cofounder emails here
    'tomas@baltra.ai',
    'alan@baltra.ai',
    'claudio@baltra.ai',
    'alberto@baltra.ai',
    'demo@baltra.ai',
    'a@a.ai',
    'company1@baltra.ai',
    'company2@baltra.ai',
    'company3@baltra.ai',
    'company4@baltra.ai',
    'company5@baltra.ai',
    'company6@baltra.ai',
    'company7@baltra.ai',
    'company8@baltra.ai',
    'company9@baltra.ai',
    'company10@baltra.ai',
    'company11@baltra.ai',
    'company12@baltra.ai',
    'company13@baltra.ai',
    'company14@baltra.ai',
    'company15@baltra.ai',
];

// Helper function to check if a user is internal
const isInternalUser = (email?: string) => {
    if (!email) return false;
    return INTERNAL_USERS.includes(email.toLowerCase());
};

// Identify user in Mixpanel
export const identifyUser = (user: any, companyId: string | null) => {
    if (!user?.email) {
        return;
    }

    // Set the distinct_id to the user's email
    mixpanel.identify(user.email);

    // Set user properties
    if (typeof window !== 'undefined') {
        const userProperties = {
            $email: user.email,
            $name: user.name,
            business_unit_id: companyId,
            is_internal: isInternalUser(user.email),
        };
        mixpanel.people.set(userProperties);
    }
};

// Track page views
export const trackPageView = (pageName: string, user: any, companyId: any) => {
    if (typeof window === 'undefined') {
        return;
    }

    // Identify user before tracking
    identifyUser(user, companyId);

    const properties = {
        distinct_id: user?.email,
        page_name: pageName,
        user_email: user?.email,
        business_unit_id: companyId,
        is_internal: isInternalUser(user?.email),
    };

    mixpanel.track('page_view_screening', properties);
};

// Track dashboard views
export const trackDashboardView = (user: any, companyId: any) => {
    if (typeof window === 'undefined') {
        return;
    }

    // Identify user before tracking
    identifyUser(user, companyId);

    const properties = {
        distinct_id: user?.email,
        user_email: user?.email,
        business_unit_id: companyId,
        is_internal: isInternalUser(user?.email),
    };

    mixpanel.track('dashboard_view_screening', properties);
};

// Track login events
export const trackLogin = (user: any, companyId: string | null) => {
    if (typeof window === 'undefined') {
        return;
    }

    // Identify user before tracking
    identifyUser(user, companyId);

    const properties = {
        distinct_id: user?.email,
        user_email: user?.email,
        business_unit_id: companyId,
        is_internal: isInternalUser(user?.email),
        login_timestamp: new Date().toISOString(),
    };

    mixpanel.track('login_screening', properties);
};

// Track specific events with custom properties
export const trackEvent = (
    eventName: string,
    user: any,
    companyId: any,
    customProperties: Record<string, any> = {}
) => {
    if (typeof window === 'undefined') {
        return;
    }

    // Identify user before tracking
    identifyUser(user, companyId);

    const properties = {
        distinct_id: user?.email,
        user_email: user?.email,
        business_unit_id: companyId,
        is_internal: isInternalUser(user?.email),
        event_timestamp: new Date().toISOString(),
        ...customProperties,
    };
    mixpanel.track(eventName, properties);
};

// Track user session activity (for session duration tracking)
export const trackSessionActivity = (
    user: any,
    companyId: string | null,
    activityType: string
) => {
    trackEvent('session_activity', user, companyId, {
        activity_type: activityType,
        url:
            typeof window !== 'undefined'
                ? window.location.pathname
                : 'unknown',
        user_agent:
            typeof window !== 'undefined' ? navigator.userAgent : 'unknown',
    });
};

export default mixpanel;
