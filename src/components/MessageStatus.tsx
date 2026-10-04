import { Check } from "lucide-react";

type MessageStatusProps = {
    /** true if this is still an optimistic (temp) message, not yet confirmed by the server */
    isPending: boolean;
    /** whether the other party has read the message — only relevant for DMs */
    isRead?: boolean;
    /** class applied to the icon wrapper */
    className?: string;
};

/**
 * Renders a delivery status indicator for a sent message:
 *  - Pending  → single gray check (lighter opacity)
 *  - Sent     → double gray check
 *  - Seen     → double green check
 */
export function MessageStatus({ isPending, isRead, className = "" }: MessageStatusProps) {
    if (isPending) {
        return (
            <span className={`inline-flex items-center ${className}`} title="Sending…">
                <Check size={10} className="opacity-40" />
            </span>
        );
    }

    if (isRead) {
        return (
            <span className={`inline-flex items-center -space-x-[5px] ${className}`} title="Seen">
                <Check size={10} className="text-green-400" />
                <Check size={10} className="text-green-400" />
            </span>
        );
    }

    return (
        <span className={`inline-flex items-center -space-x-[5px] ${className}`} title="Sent">
            <Check size={10} className="opacity-60" />
            <Check size={10} className="opacity-60" />
        </span>
    );
}
