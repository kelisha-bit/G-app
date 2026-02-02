import React from 'react';
import { Text, StyleSheet } from 'react-native';

/**
 * FormattedText Component
 * 
 * Renders text with basic formatting support:
 * - **text** or __text__ for bold
 * - *text* or _text_ for italic (optional)
 * 
 * Usage:
 *   <FormattedText style={styles.text}>
 *     This is **bold** and this is normal text.
 *   </FormattedText>
 * 
 * When saving to Firestore, use:
 *   "This is **bold** text"
 *   "This is __bold__ text"
 */
export default function FormattedText({ children, style, ...props }) {
  if (typeof children !== 'string') {
    return <Text style={style} {...props}>{children}</Text>;
  }

  const parseText = (text) => {
    const parts = [];
    let lastIndex = 0;
    
    // Match **bold** or __bold__ patterns
    const boldPattern = /(\*\*|__)(.+?)\1/g;
    let match;
    let foundMatch = false;
    
    while ((match = boldPattern.exec(text)) !== null) {
      foundMatch = true;
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push({
          text: text.substring(lastIndex, match.index),
          bold: false,
        });
      }
      
      // Add the bold text
      parts.push({
        text: match[2],
        bold: true,
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        text: text.substring(lastIndex),
        bold: false,
      });
    }
    
    // If no matches found, return original text as single part
    if (!foundMatch) {
      return [{ text, bold: false }];
    }
    
    return parts;
  };

  const parts = parseText(children);

  return (
    <Text style={style} {...props}>
      {parts.map((part, index) => (
        <Text
          key={index}
          style={part.bold ? [style, styles.bold] : style}
        >
          {part.text}
        </Text>
      ))}
    </Text>
  );
}

const styles = StyleSheet.create({
  bold: {
    fontWeight: 'bold',
  },
});

