import { languageDelimiters } from './delimiters';

export interface HeaderInfo {
  filename: string;
  author: string;
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
}

const genericTemplate = `
********************************************************************************
*                                                                              *
*                                                         :::      ::::::::    *
*    $FILENAME_________________________________________ :+:      :+:    :+:    *
*                                                     +:+ +:+         +:+      *
*    By: $AUTHOR___________________________________ +#+  +:+       +#+         *
*                                                 +#+#+#+#+#+   +#+            *
*    Created: $CREATEDAT_________ by $CREATEDBY_       #+#    #+#              *
*    Updated: $UPDATEDAT_________ by $UPDATEDBY_      ###   #######belgium.be  *
*                                                                              *
********************************************************************************
`.substring(1);

const getTemplate = (languageId: string): string => {
  const delimiters = languageDelimiters[languageId];
  if (!delimiters) {
    throw new Error(`Unsupported language: ${languageId}`);
  }

  const [left, right] = delimiters;
  const width = left.length;

  return genericTemplate
    .replace(new RegExp(`^(.{${width}})(.*)(.{${width}})$`, 'gm'),
      left + '$2' + right);
};

const pad = (value: string, width: number): string =>
  value.concat(' '.repeat(width)).slice(0, width);

const formatDate = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');

  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ` +
         `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const parseDate = (dateStr: string): Date => {
  const parts = dateStr.match(/^(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
  
  if (!parts) {
    return new Date();
  }

  const [, year, month, day, hours, minutes, seconds] = parts;
  return new Date(+year, +month - 1, +day, +hours, +minutes, +seconds);
};

export const supportsLanguage = (languageId: string): boolean =>
  languageId in languageDelimiters;

export const extractHeader = (text: string): string | null => {
  const headerRegex = `^(.{80}(\r\n|\n)){10}`;
  const match = text.match(headerRegex);

  return match ? match[0].split('\r\n').join('\n') : null;
};

const fieldRegex = (name: string): RegExp =>
    new RegExp(`^(.*?)(\\$${name}_*)`, 's');

const getFieldValue = (header: string, name: string): string => {
  const match = genericTemplate.match(fieldRegex(name));
  
  if (!match) {
    throw new Error(`Field ${name} not found in template`);
  }

  const [, offset, field] = match;
  return header
  .slice(offset.length, offset.length + field.length)
  .trim();
};

const setFieldValue = (header: string, name: string, value: string): string => {
  const match = genericTemplate.match(fieldRegex(name));
  
  if (!match) {
    return header;
  }

  const [, offset, field] = match;
  
  return header.slice(0, offset.length)
    .concat(pad(value, field.length))
    .concat(header.slice(offset.length + field.length));
};

export const getHeaderInfo = (header: string): HeaderInfo => {
  try {
    return {
      filename: getFieldValue(header, 'FILENAME'),
      author: getFieldValue(header, 'AUTHOR'),
      createdBy: getFieldValue(header, 'CREATEDBY'),
      createdAt: parseDate(getFieldValue(header, 'CREATEDAT')),
      updatedBy: getFieldValue(header, 'UPDATEDBY'),
      updatedAt: parseDate(getFieldValue(header, 'UPDATEDAT'))
    };
  } catch (error) {
    const now = new Date();
    return {
      filename: '',
      author: '',
      createdBy: '',
      createdAt: now,
      updatedBy: '',
      updatedAt: now
    };
  }
};

export const renderHeader = (languageId: string, info: HeaderInfo): string => {
  const fields = [
    { name: 'FILENAME', value: info.filename },
    { name: 'AUTHOR', value: info.author },
    { name: 'CREATEDAT', value: formatDate(info.createdAt) },
    { name: 'CREATEDBY', value: info.createdBy },
    { name: 'UPDATEDAT', value: formatDate(info.updatedAt) },
    { name: 'UPDATEDBY', value: info.updatedBy }
  ];

  return fields.reduce((header, field) =>
    setFieldValue(header, field.name, field.value),
    getTemplate(languageId));
};
