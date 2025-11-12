import AsyncStorage from '@react-native-async-storage/async-storage';
import { DocType, Field, FormItem, RawField } from './types';

export async function getAllDoctypesFromLocal(): Promise<
  Record<string, DocType>
> {
  try {
    const stored = await AsyncStorage.getItem('downloadDoctypes');
    if (stored) {
      return JSON.parse(stored) as Record<string, DocType>;
    } else {
      return {};
    }
  } catch (error) {
    console.error('Error fetching local doctypes:', error);
    throw error as Error;
  }
}

export async function getAllDocTypeNames(): Promise<FormItem[]> {
  try {
    const allDoctypes = await getAllDoctypesFromLocal();

    return Object.keys(allDoctypes).map(docTypeName => ({
      name: docTypeName,
    }));
  } catch (error) {
    console.error('Error fetching docType names:', error);
    throw error as Error;
  }
}

export async function getDocTypeFromLocal(
  docTypeName: string
): Promise<DocType | null> {
  try {
    const stored = await AsyncStorage.getItem('downloadDoctypes');
    if (!stored) {
      return null;
    }
    const docTypeData = JSON.parse(stored)[docTypeName] as DocType;
    return docTypeData;
  } catch (error) {
    console.error(`Error fetching local doctype: ${docTypeName}:`, error);
    throw error as Error;
  }
}

export async function saveDocTypeToLocal(
  docTypeName: string,
  docTypeData: DocType
): Promise<boolean> {
  try {
    const existingDoctypeData = await AsyncStorage.getItem('downloadDoctypes');
    let allDocTypeStorage: Record<string, DocType> = existingDoctypeData
      ? JSON.parse(existingDoctypeData)
      : {};
    allDocTypeStorage[docTypeName] = docTypeData;
    await AsyncStorage.setItem(
      'downloadDoctypes',
      JSON.stringify(allDocTypeStorage)
    );
    return true;
  } catch (error) {
    console.error(`Error saving local doctype: ${docTypeName}:`, error);
    throw error as Error;
  }
}
export function extractFields(docType: DocType): RawField[] {
  return docType.fields.map((field: Field) => ({
    fieldname: field.fieldname,
    fieldtype: field.fieldtype,
    label: field.label,
    options: field.options,
    hidden: field.hidden,
    print_hide: field.print_hide,
    report_hide: field.report_hide,
  }));
}
