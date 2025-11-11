import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { getDoctypeByName } from '../../../lib/hey-api/client/sdk.gen';
import { extractFields } from '../../../api';
import { RawField, DocType } from '../../../types';
import SelectDropdown from '../../components/SelectDropdown';
import LinkDropdown from '../../components/LinkDropdown';
import DatePicker from '../../components/DatePicker';

type TableRowEditorRouteParams = {
  fieldname: string;
  tableDoctype: string;
  title?: string;
  index?: number; // when editing existing row
  initialRow?: Record<string, any> | null;
};

type Route = RouteProp<
  Record<'TableRowEditor', TableRowEditorRouteParams>,
  'TableRowEditor'
>;

const TableRowEditor: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const route = useRoute<Route>();
  const navigation = useNavigation();
  const { fieldname, tableDoctype, index, initialRow, title } = route.params;

  const [fields, setFields] = useState<RawField[]>([]);
  const [rowData, setRowData] = useState<Record<string, any>>(initialRow || {});
  const [loading, setLoading] = useState<boolean>(true);
  const [dropdownStates, setDropdownStates] = useState<Record<string, boolean>>(
    {}
  );

  const loadSchema = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getDoctypeByName({
        path: { form_name: tableDoctype },
      });
      const responseData = response.data as { data: DocType };
      const fetched = responseData.data;
      const f = extractFields(fetched);
      // Allow same basic input types in row editor
      const allowed = [
        'Data',
        'Select',
        'Text',
        'Int',
        'Float',
        'Link',
        'Date',
      ];
      setFields(f.filter(x => !x.hidden && allowed.includes(x.fieldtype)));
    } catch (e) {
      Alert.alert(t('common.error'), `Failed to load "${tableDoctype}" schema`);
    } finally {
      setLoading(false);
    }
  }, [tableDoctype, t]);

  useEffect(() => {
    loadSchema();
  }, [loadSchema]);

  const handleChange = (name: string, value: any) => {
    setRowData(prev => ({ ...prev, [name]: value }));
  };
  const toggleDropdown = (name: string) => {
    setDropdownStates(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleSave = async () => {
    try {
      // return row back to FormDetail via temp storage
      await AsyncStorage.setItem(
        'tableRowDraft',
        JSON.stringify({
          fieldname,
          index: typeof index === 'number' ? index : null,
          row: rowData,
        })
      );
      // @ts-ignore
      navigation.goBack();
    } catch {
      Alert.alert(t('common.error'), 'Failed to save row');
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: theme.background }}
      >
        <View className="flex-1 items-center justify-center">
          <Text style={{ color: theme.subtext }}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
    >
      <View
        className="border-b px-4 py-3 pt-10"
        style={{ borderBottomColor: theme.border }}
      >
        <Text className="text-xl font-semibold" style={{ color: theme.text }}>
          {title || tableDoctype}
        </Text>
      </View>
      <ScrollView className="flex-1 p-4">
        {fields.map((field, idx) => {
          const isSelectField = field.fieldtype === 'Select' && field.options;
          const optionsList =
            isSelectField && field.options
              ? field.options.split('\n').filter((opt: string) => opt.trim())
              : [];
          const isLinkField = field.fieldtype === 'Link' && field.options;
          const isDateField = field.fieldtype === 'Date';
          const value = rowData[field.fieldname];
          const isNumeric =
            field.fieldtype === 'Int' || field.fieldtype === 'Float';
          const isOpen = dropdownStates[field.fieldname] || false;
          return (
            <View
              key={field.fieldname}
              className="mb-4"
              style={{ zIndex: 1000 - idx }}
            >
              <Text className="mb-1" style={{ color: theme.text }}>
                {field.label || field.fieldname}
              </Text>
              {isSelectField ? (
                <SelectDropdown
                  options={optionsList}
                  value={value}
                  onValueChange={val => handleChange(field.fieldname, val)}
                  placeholder={t('formDetail.selectPlaceholder', {
                    label: field.label || field.fieldname,
                  })}
                  isOpen={isOpen}
                  onToggle={() => toggleDropdown(field.fieldname)}
                />
              ) : isLinkField ? (
                <LinkDropdown
                  doctype={field.options as string}
                  value={value}
                  onValueChange={val => handleChange(field.fieldname, val)}
                  placeholder={t('formDetail.selectPlaceholder', {
                    label: field.label || field.fieldname,
                  })}
                  isOpen={isOpen}
                  onToggle={() => toggleDropdown(field.fieldname)}
                />
              ) : isDateField ? (
                <DatePicker
                  value={value}
                  onValueChange={val => handleChange(field.fieldname, val)}
                  placeholder={t('formDetail.selectPlaceholder', {
                    label: field.label || field.fieldname,
                  })}
                />
              ) : (
                <TextInput
                  className="h-[40px] w-full rounded-md border px-3"
                  style={{
                    borderColor: theme.border,
                    backgroundColor: theme.background,
                    color: theme.text,
                  }}
                  value={value || ''}
                  placeholder={t('formDetail.enterPlaceholder', {
                    label: field.label || field.fieldname,
                  })}
                  placeholderTextColor={theme.subtext}
                  keyboardType={isNumeric ? 'numeric' : 'default'}
                  onChangeText={text => handleChange(field.fieldname, text)}
                />
              )}
            </View>
          );
        })}
        <TouchableOpacity
          className="mt-2 rounded-md p-4"
          style={{ backgroundColor: theme.buttonBackground }}
          onPress={handleSave}
        >
          <Text style={{ color: theme.buttonText }}>{t('common.save')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TableRowEditor;
