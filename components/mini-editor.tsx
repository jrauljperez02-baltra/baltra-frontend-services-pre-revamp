'use client';

import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { SmileIcon } from 'lucide-react';

const EMOJIS = [
    '😀',
    '😃',
    '😄',
    '😁',
    '😆',
    '😅',
    '😂',
    '🤣',
    '😊',
    '😇',
    '🙂',
    '🙃',
    '😉',
    '😌',
    '😍',
    '🥰',
    '😘',
    '😗',
    '😙',
    '😚',
    '😋',
    '😛',
    '😝',
    '😜',
    '🤪',
    '🤨',
    '🧐',
    '🤓',
    '😎',
    '🤩',
    '🥳',
    '😏',
    '😒',
    '😞',
    '😔',
    '😟',
    '😕',
    '🙁',
    '☹️',
    '😣',
    '😖',
    '😫',
    '😩',
    '🥺',
    '😢',
    '😭',
    '😤',
    '😠',
    '😡',
    '🤬',
    '🤯',
    '😳',
    '🥵',
    '🥶',
    '😱',
    '😨',
    '😰',
    '😥',
    '😓',
    '🤗',
    '🤔',
    '🤭',
    '🤫',
    '🤥',
    '😶',
    '😐',
    '😑',
    '😬',
    '🙄',
    '😯',
    '😦',
    '😧',
    '😮',
    '😲',
    '🥱',
    '😴',
    '🤤',
    '😪',
    '😵',
    '🤐',
    '🥴',
    '🤢',
    '🤮',
    '🤧',
    '😷',
    '🤒',
    '🤕',
    '🤑',
    '🤠',
    '😈',
    '👿',
    '👹',
    '👺',
    '🤡',
    '💩',
    '👻',
    '💀',
    '☠️',
    '👽',
    '👾',
    '🤖',
    '🎃',
    '😺',
    '😸',
    '😹',
    '😻',
    '😼',
    '😽',
    '🙀',
    '😿',
    '😾',
    '👋',
    '🤚',
    '🖐️',
    '✋',
    '🖖',
    '👌',
    '🤏',
    '✌️',
    '🤞',
    '🤟',
    '🤘',
    '🤙',
    '👈',
    '👉',
    '👆',
    '🖕',
    '👇',
    '☝️',
    '👍',
    '👎',
    '✊',
    '👊',
    '🤛',
    '🤜',
    '👏',
    '🙌',
    '👐',
    '🤲',
    '🤝',
    '🙏',
    '✍️',
    '💅',
    '🤳',
    '💪',
    '🦾',
];
const MAX_CHARS = 1024;

interface MiniEditorProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

export function MiniEditor({ value, onChange, disabled }: MiniEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleEmojiClick = (emoji: string) => {
        const textarea = textareaRef.current;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newValue =
                value.substring(0, start) + emoji + value.substring(end);
            if (newValue.length <= MAX_CHARS) {
                onChange(newValue);
            }
        }
    };

    return (
        <div className="relative space-y-2">
            <div className="flex items-center justify-end rounded-t-md border bg-muted p-1">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" disabled={disabled}>
                            {' '}
                            <SmileIcon className="h-4 w-4" />{' '}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                        <div className="grid grid-cols-8 gap-1">
                            {EMOJIS.map((emoji) => (
                                <Button
                                    key={emoji}
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEmojiClick(emoji)}
                                    className="text-xl"
                                >
                                    {emoji}
                                </Button>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
            <Textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => {
                    if (e.target.value.length <= MAX_CHARS) {
                        onChange(e.target.value);
                    }
                }}
                disabled={disabled}
                rows={5}
                className="resize-none rounded-t-none focus-visible:ring-0 focus-visible:ring-offset-0 border-t-0"
            />
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                {value.length} / {MAX_CHARS}
            </div>
        </div>
    );
}
