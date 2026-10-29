// Match Java LocalDateTime.plusMonths: clamp dates at the destination month end.
export function renewalEndDate(value, months) {
    if (!value || !Number.isInteger(months)) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const day = date.getDate();
    date.setDate(1);
    date.setMonth(date.getMonth() + months);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    date.setDate(Math.min(day, lastDay));
    return date;
}
