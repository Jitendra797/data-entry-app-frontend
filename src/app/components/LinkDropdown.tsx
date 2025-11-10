import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { getLinkOptions } from '../../lib/hey-api/client/sdk.gen';

type LinkDropdownProps = {
  doctype: string; // linked doctype to fetch options for
  value?: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  isOpen: boolean;
  onToggle: () => void;
  containerZIndex?: number;
};

const LinkDropdown: React.FC<LinkDropdownProps> = ({
  doctype,
  value,
  onValueChange,
  placeholder,
  isOpen,
  onToggle,
  containerZIndex,
}) => {
  const { theme } = useTheme();
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const containerStyle = {
    position: 'relative' as const,
    zIndex: containerZIndex,
  };

  const dropdownStyle = {
    position: 'absolute' as const,
    top: 45,
    left: 0,
    right: 0,
    zIndex: 2000,
    backgroundColor: theme.dropdownBg,
    borderWidth: 1.5,
    borderColor: theme.border,
    borderRadius: 8,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 20,
  };

  const dropdownMaxHeight = Math.min(Math.max(options.length, 4) * 48, 480);

  const scrollViewStyle = {
    maxHeight: dropdownMaxHeight,
  };

  const normalizedDoctype = useMemo(() => (doctype || '').trim(), [doctype]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (!normalizedDoctype) {
      return;
    }
    let cancelled = false;
    const fetchOptions = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getLinkOptions({
          path: { linked_doctype: normalizedDoctype },
        });
        console.log('[LinkDropdown] fetched link options', {
          doctype: normalizedDoctype,
          response,
        });
        // API returns unknown type; attempt to normalize common shapes
        const raw = (response as any)?.data ?? (response as any);
        let list: unknown[] = [];
        if (Array.isArray(raw)) {
          list = raw as unknown[];
        } else if (raw && Array.isArray(raw.data)) {
          list = raw.data as unknown[];
        }
        const normalizedOptions: string[] = list
          .map(item => {
            if (typeof item === 'string') {
              return item;
            }
            if (item && typeof item === 'object') {
              const obj = item as Record<string, unknown>;
              const labelCandidate =
                obj.label ??
                obj.value ??
                obj.name ??
                obj.title ??
                obj.id ??
                obj.key;
              if (typeof labelCandidate === 'string') {
                return labelCandidate;
              }
            }
            return undefined;
          })
          .filter(
            (opt): opt is string =>
              typeof opt === 'string' && opt.trim().length > 0
          )
          .map(opt => opt.trim());
        const truncatedList = normalizedOptions.slice(0, 10);
        console.log('[LinkDropdown] parsed options', {
          total: list.length,
          rendered: truncatedList.length,
          sample: truncatedList,
        });
        if (!cancelled) {
          setOptions(truncatedList);
        }
      } catch (e) {
        if (!cancelled) {
          setError('Failed to load options');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    fetchOptions();
    return () => {
      cancelled = true;
    };
  }, [isOpen, normalizedDoctype]);

  return (
    <View style={containerStyle}>
      <TouchableOpacity
        className="h-[40px] w-full flex-row items-center justify-between rounded-md border px-3"
        style={{
          borderColor: theme.border,
          backgroundColor: theme.background,
        }}
        onPress={onToggle}
      >
        <Text
          className="flex-1"
          style={{
            color: value ? theme.text : theme.subtext,
          }}
        >
          {value || placeholder}
        </Text>
        <ChevronDown
          size={16}
          color={theme.subtext}
          style={{
            transform: [{ rotate: isOpen ? '180deg' : '0deg' }],
          }}
        />
      </TouchableOpacity>

      {isOpen && (
        <View style={{ ...dropdownStyle, maxHeight: dropdownMaxHeight }}>
          {loading ? (
            <View className="items-center justify-center px-4 py-6">
              <ActivityIndicator color={theme.subtext} />
            </View>
          ) : error ? (
            <View className="px-4 py-6">
              <Text
                className="text-center text-sm"
                style={{ color: theme.subtext }}
              >
                {error}
              </Text>
            </View>
          ) : (
            <ScrollView nestedScrollEnabled={true} style={scrollViewStyle}>
              {options.length > 0 ? (
                options.map((option: string, optIndex: number) => {
                  const trimmedOption = (option || '').toString().trim();
                  const isSelected = value === trimmedOption;
                  const fontWeight = isSelected
                    ? ('600' as const)
                    : ('normal' as const);
                  return (
                    <TouchableOpacity
                      key={`${trimmedOption}-${optIndex}`}
                      className={`px-4 py-3 ${optIndex < options.length - 1 ? 'border-b' : ''}`}
                      style={{
                        backgroundColor: isSelected
                          ? theme.dropdownSelectedBg
                          : theme.dropdownBg,
                        borderBottomColor:
                          optIndex < options.length - 1
                            ? theme.border
                            : undefined,
                      }}
                      onPress={() => {
                        onValueChange(trimmedOption);
                      }}
                    >
                      <Text
                        style={{
                          color: theme.text,
                          fontWeight,
                        }}
                      >
                        {trimmedOption}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View className="px-4 py-6">
                  <Text
                    className="text-center text-sm"
                    style={{ color: theme.subtext }}
                  >
                    No options available
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
};

export default LinkDropdown;
