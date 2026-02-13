export const rawDateFix = (rawDate: string) => {
    if (rawDate.includes('-06:00')) {
        return rawDate;
    }

    return `${rawDate}-06:00`;
};
