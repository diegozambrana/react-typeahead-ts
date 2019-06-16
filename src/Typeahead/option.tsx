import * as React from 'react';
import classNames from 'classnames';
import { SelectorOptionSelector } from '../types';

export interface CustomClasses {
  listItem?: string;
  hover?: string;
  customAdd?: string;
  listAnchor?: string;
}

export interface Props {
  customClasses?: CustomClasses;
  customValue?: string;
  children: React.ReactNode;
  hover?: boolean;
  result?: string;
  onOptionSelected: SelectorOptionSelector<string>;
}

const getClasses = ({
  customClasses,
}: {
  customClasses: { listAnchor?: string };
}) => {
  const classes: any = {
    'typeahead-option': true,
  };
  const { listAnchor } = customClasses;
  if (listAnchor) {
    classes[listAnchor] = true;
  }

  return classNames(classes);
};

/**
 * A single option within the TypeaheadSelector
 */
const TypeaheadOption = (props: Props) => {
  const {
    customClasses = {},
    hover = false,
    children,
    customValue,
    result,
    onOptionSelected,
  } = props;

  const onClick = React.useCallback(
    (event: React.MouseEvent<HTMLLIElement>) => {
      event.preventDefault();
      if (customValue) {
        onOptionSelected(customValue, event);
      } else if (result) {
        onOptionSelected(result, event);
      }
    },
    [onOptionSelected, result, customValue]
  );

  const classes: any = {};
  const { listItem, hover: hoverClass = 'hover', customAdd } = customClasses;
  classes[hoverClass] = Boolean(hover);
  if (listItem) {
    classes[listItem] = Boolean(listItem);
  }

  if (customValue && customAdd) {
    classes[customAdd] = Boolean(customAdd);
  }

  const classList = classNames(classes);

  // For some reason onClick is not fired when clicked on an option
  // onMouseDown is used here as a workaround of #205 and other
  // related tickets
  return (
    <li className={classList} onClick={onClick} onMouseDown={onClick}>
      <a href="javascript: void 0;" className={getClasses({ customClasses })}>
        {children}
      </a>
    </li>
  );
};

export default TypeaheadOption;
