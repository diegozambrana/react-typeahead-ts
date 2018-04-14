import _ from 'lodash';
import sinon from 'sinon';
import * as React from 'react';
import ReactDOM from 'react-dom';
import Typeahead from '../src/typeahead';
import TypeaheadOption from '../src/typeahead/option';
import TypeaheadSelector from '../src/typeahead/selector';
import Keyevent from '../src/keyevent';
import TestUtils from 'react-dom/test-utils';
import createReactClass from 'create-react-class';

function simulateTextInput(component, value) {
  const node = component.refs.entry;
  node.value = value;
  TestUtils.Simulate.change(node);
  return TestUtils.scryRenderedComponentsWithType(component, TypeaheadOption);
}

const BEATLES = ['John', 'Paul', 'George', 'Ringo'];

const BEATLES_COMPLEX = [
  {
    firstName: 'John',
    lastName: 'Lennon',
    nameWithTitle: 'John Winston Ono Lennon MBE',
  }, {
    firstName: 'Paul',
    lastName: 'McCartney',
    nameWithTitle: 'Sir James Paul McCartney MBE',
  }, {
    firstName: 'George',
    lastName: 'Harrison',
    nameWithTitle: 'George Harrison MBE',
  }, {
    firstName: 'Ringo',
    lastName: 'Starr',
    nameWithTitle: 'Richard Starkey Jr. MBE',
  },
];

describe('Typeahead Component', () => {
  let testContext;

  beforeEach(() => {
    testContext = {};
  });

  // Prev. tests moved (sanity, props - sections)

  describe('props', () => {
    describe('searchOptions', () => {
      test('maps correctly when specified with map function', () => {
        const createObject = function (o) {
          return { len: o.length, orig: o };
        };

        const component = TestUtils.renderIntoDocument(
          <Typeahead
            options={BEATLES}
            searchOptions={(inp, opts) => opts.map(createObject)}
            displayOption={(o, i) => `Score: ${o.len} ${o.orig}`}
            inputDisplayOption={function (o, i) { return o.orig; }}
          />);

        const results = simulateTextInput(component, 'john');
        expect(ReactDOM.findDOMNode(results[0]).textContent).toEqual('Score: 4 John');
      });

      test(
        'can sort displayed items when specified with map function wrapped with sort',
        () => {
          const createObject = function (o) {
            return { len: o.length, orig: o };
          };

          const component = TestUtils.renderIntoDocument(
            <Typeahead
              options={BEATLES}
              searchOptions={(inp, opts) => opts.map(o => o).sort().map(createObject)}
              displayOption={(o, i) => `Score: ${o.len} ${o.orig}`}
              inputDisplayOption={function (o, i) { return o.orig; }}
            />);

          const results = simulateTextInput(component, 'john');
          expect(ReactDOM.findDOMNode(results[0]).textContent).toEqual('Score: 6 George');
        },
      );
    });

    describe('inputDisplayOption', () => {
      test(
        'displays a different value in input field and in list display',
        () => {
          const createObject = function (o) {
            return { len: o.length, orig: o };
          };

          const component = TestUtils.renderIntoDocument(
            <Typeahead
              options={BEATLES}
              searchOptions={(inp, opts) => opts.map(o => o).sort().map(createObject)}
              displayOption={function (o, i) { return 'Score: ' + o.len + ' ' + o.orig; }}
              inputDisplayOption={function (o, i) { return o.orig; }}
            />);

          const results = simulateTextInput(component, 'john');
          const node = component.refs.entry;
          TestUtils.Simulate.keyDown(node, { keyCode: Keyevent.DOM_VK_TAB });

          expect(node.value).toEqual('George');
        },
      );
    });

    describe('allowCustomValues', () => {

      beforeEach(() => {
        testContext.sinon = sinon.sandbox.create();
        testContext.selectSpy = testContext.sinon.spy();
        testContext.component = TestUtils.renderIntoDocument(
          <Typeahead
            options={BEATLES}
            allowCustomValues={3}
            onOptionSelected={testContext.selectSpy}
          />);
      });

      afterEach(() => {
        testContext.sinon.restore();
      });

      test(
        'should not display custom value if input length is less than entered',
        () => {
          const input = testContext.component.refs.entry;
          input.value = 'zz';
          TestUtils.Simulate.change(input);
          // tslint:disable-next-line:max-line-length
          const results = TestUtils.scryRenderedComponentsWithType(testContext.component, TypeaheadOption);
          expect(0).toEqual(results.length);
          expect(false).toEqual(testContext.selectSpy.called);
        },
      );

      test(
        'should display custom value if input exceeds props.allowCustomValues',
        () => {
          const input = testContext.component.refs.entry;
          input.value = 'ZZZ';
          TestUtils.Simulate.change(input);
          // tslint:disable-next-line:max-line-length
          const results = TestUtils.scryRenderedComponentsWithType(testContext.component, TypeaheadOption);
          expect(1).toEqual(results.length);
          expect(false).toEqual(testContext.selectSpy.called);
        },
      );

      test('should call onOptionSelected when selecting from options', () => {
        const results = simulateTextInput(testContext.component, 'o');
        const firstItem = ReactDOM.findDOMNode(results[0]).innerText;
        const node = testContext.component.refs.entry;
        TestUtils.Simulate.keyDown(node, { keyCode: Keyevent.DOM_VK_DOWN });
        TestUtils.Simulate.keyDown(node, { keyCode: Keyevent.DOM_VK_DOWN });
        TestUtils.Simulate.keyDown(node, { keyCode: Keyevent.DOM_VK_UP });
        TestUtils.Simulate.keyDown(node, { keyCode: Keyevent.DOM_VK_RETURN });

        expect(true).toEqual(testContext.selectSpy.called);
        expect(testContext.selectSpy.calledWith(firstItem)).toBeTruthy();
      });

      test('should call onOptionSelected when custom value is selected', () => {
        const input = testContext.component.refs.entry;
        input.value = 'ZZZ';
        TestUtils.Simulate.change(input);
        TestUtils.Simulate.keyDown(input, { keyCode: Keyevent.DOM_VK_DOWN });
        TestUtils.Simulate.keyDown(input, { keyCode: Keyevent.DOM_VK_RETURN });
        expect(true).toEqual(testContext.selectSpy.called);
        expect(testContext.selectSpy.calledWith(input.value)).toBeTruthy();
      });

      test('should add hover prop to customValue', () => {
        const input = testContext.component.refs.entry;
        input.value = 'ZZZ';
        TestUtils.Simulate.change(input);
        // tslint:disable-next-line:max-line-length
        const results = TestUtils.scryRenderedComponentsWithType(testContext.component, TypeaheadOption);
        TestUtils.Simulate.keyDown(input, { keyCode: Keyevent.DOM_VK_DOWN });
        expect(true).toEqual(results[0].props.hover);
      });


    });

    describe('customClasses', () => {

      beforeAll(function () {
        const customClasses = {
          input: 'topcoat-text-input',
          results: 'topcoat-list__container',
          listItem: 'topcoat-list__item',
          listAnchor: 'topcoat-list__link',
          hover: 'topcoat-list__item-active',
        };

        this.component = TestUtils.renderIntoDocument(
          <Typeahead
            options={BEATLES}
            customClasses={customClasses}
          />);

        simulateTextInput(this.component, 'o');
      });

      test('adds a custom class to the typeahead input', () => {
        const input = testContext.component.refs.entry;
        expect(input.classList.contains('topcoat-text-input')).toBe(true);
      });

      test('adds a custom class to the results component', () => {
        // tslint:disable-next-line:max-line-length
        const results = ReactDOM.findDOMNode(TestUtils.findRenderedComponentWithType(testContext.component, TypeaheadSelector));
        expect(results.classList.contains('topcoat-list__container')).toBe(true);
      });

      test('adds a custom class to the list items', () => {
        // tslint:disable-next-line:max-line-length
        const typeaheadOptions = TestUtils.scryRenderedComponentsWithType(testContext.component, TypeaheadOption);
        const listItem = ReactDOM.findDOMNode(typeaheadOptions[1]);
        expect(listItem.classList.contains('topcoat-list__item')).toBe(true);
      });

      test('adds a custom class to the option anchor tags', () => {
        // tslint:disable-next-line:max-line-length
        const typeaheadOptions = TestUtils.scryRenderedComponentsWithType(testContext.component, TypeaheadOption);
        const listAnchor = typeaheadOptions[1].refs.anchor;
        expect(listAnchor.classList.contains('topcoat-list__link')).toBe(true);
      });

      test('adds a custom class to the list items when active', () => {
        // tslint:disable-next-line:max-line-length
        const typeaheadOptions = TestUtils.scryRenderedComponentsWithType(testContext.component, TypeaheadOption);
        const node = testContext.component.refs.entry;

        TestUtils.Simulate.keyDown(node, { keyCode: Keyevent.DOM_VK_DOWN });

        const listItem = typeaheadOptions[0];
        const domListItem = ReactDOM.findDOMNode(listItem);

        expect(domListItem.classList.contains('topcoat-list__item-active')).toBe(true);
      });
    });

    describe('initialValue', () => {
      test(
        'should perform an initial search if a default value is provided',
        () => {
          const component = TestUtils.renderIntoDocument(
            <Typeahead
              options={BEATLES}
              initialValue={'o'}
            />);

          const results = TestUtils.scryRenderedComponentsWithType(component, TypeaheadOption);
          expect(results.length).toEqual(3);
        },
      );
    });

    describe('value', () => {
      test('should set input value', () => {
        const component = TestUtils.renderIntoDocument(
          <Typeahead
            options={BEATLES}
            value={'John'}
          />);

        const input = component.refs.entry;
        expect(input.value).toEqual('John');
      });
    });

    describe('onKeyDown', () => {
      test('should bind to key events on the input', () => {
        const component = TestUtils.renderIntoDocument(
          <Typeahead
            options={BEATLES}
            onKeyDown={ function (e) {
              expect(e.keyCode).toEqual(87);
            }
            }
          />);

        const input = component.refs.entry;
        TestUtils.Simulate.keyDown(input, { keyCode: 87 });
      });
    });

    describe('onKeyPress', () => {
      test('should bind to key events on the input', () => {
        const component = TestUtils.renderIntoDocument(
          <Typeahead
            options={BEATLES}
            onKeyPress={ function (e) {
              expect(e.keyCode).toEqual(87);
            }
            }
          />);

        const input = component.refs.entry;
        TestUtils.Simulate.keyPress(input, { keyCode: 87 });
      });
    });

    describe('onKeyUp', () => {
      test('should bind to key events on the input', () => {
        const component = TestUtils.renderIntoDocument(
          <Typeahead
            options={BEATLES}
            onKeyUp={ function (e) {
              expect(e.keyCode).toEqual(87);
            }}
          />);

        const input = component.refs.entry;
        TestUtils.Simulate.keyUp(input, { keyCode: 87 });
      });
    });

    describe('inputProps', () => {
      test('should forward props to the input element', () => {
        const component = TestUtils.renderIntoDocument(
          <Typeahead
            options={BEATLES}
            inputProps={{ autoCorrect: 'off' }}
          />);

        const input = component.refs.entry;
        expect(input.getAttribute('autoCorrect')).toEqual('off');
      });
    });

    describe('defaultClassNames', () => {
      test('should remove default classNames when this prop is specified and false', () => {
        const component = TestUtils.renderIntoDocument(
          <Typeahead
            options={BEATLES}
            defaultClassNames={false}
          />);
        simulateTextInput(component, 'o');

        expect(ReactDOM.findDOMNode(component).classList.contains('typeahead')).toBeFalsy();
        expect(
          ReactDOM.findDOMNode(component.refs.sel).classList.contains('typeahead-selector'),
        ).toBeFalsy();
      });
    });

    describe('filterOption', () => {
      const FN_TEST_PLANS = [
        {
          name: 'accepts everything',
          fn() { return true; },
          input: 'xxx',
          output: 4,
        }, {
          name: 'rejects everything',
          fn() { return false; },
          input: 'o',
          output: 0,
        },
      ];

      _.each(FN_TEST_PLANS, (testplan) => {
        test(`should filter with a custom function that ${testplan.name}`, () => {
          const component = TestUtils.renderIntoDocument(
            <Typeahead
              options={BEATLES}
              filterOption={testplan.fn}
            />);

          const results = simulateTextInput(component, testplan.input);
          expect(results.length).toEqual(testplan.output);
        });
      });

      const STRING_TEST_PLANS = {
        o: 3,
        pa: 1,
        Grg: 1,
        Ringo: 1,
        xxx: 0,
      };

      test('should filter using fuzzy matching on the provided field name', () => {
        const component = TestUtils.renderIntoDocument(
          <Typeahead
            options={BEATLES_COMPLEX}
            filterOption="firstName"
            displayOption="firstName"
          />);

        _.each(STRING_TEST_PLANS, (expected, value) => {
          const results = simulateTextInput(component, value);
          expect(results.length).toEqual(expected);
        });
      });
    });

    describe('formInputOption', () => {
      const FORM_INPUT_TEST_PLANS = [
        {
          name: 'uses simple options verbatim when not specified',
          props: {
            options: BEATLES,
          },
          output: 'John',
        }, {
          name: 'defaults to the display string when not specified',
          props: {
            options: BEATLES_COMPLEX,
            filterOption: 'firstName',
            displayOption: 'nameWithTitle',
          },
          output: 'John Winston Ono Lennon MBE',
        }, {
          name: 'uses custom options when specified as a string',
          props: {
            options: BEATLES_COMPLEX,
            filterOption: 'firstName',
            displayOption: 'nameWithTitle',
            formInputOption: 'lastName',
          },
          output: 'Lennon',
        }, {
          name: 'uses custom optinos when specified as a function',
          props: {
            options: BEATLES_COMPLEX,
            filterOption: 'firstName',
            displayOption: 'nameWithTitle',
            formInputOption(o, i) { return o.firstName + ' ' + o.lastName; },
          },
          output: 'John Lennon',
        },
      ];

      _.each(FORM_INPUT_TEST_PLANS, (testplan) => {
        test(testplan.name, () => {
          const component = TestUtils.renderIntoDocument(
            <Typeahead
              {...testplan.props}
              name="beatles"
            />);
          const results = simulateTextInput(component, 'john');

          const node = component.refs.entry;
          TestUtils.Simulate.keyDown(node, { keyCode: Keyevent.DOM_VK_DOWN });
          TestUtils.Simulate.keyDown(node, { keyCode: Keyevent.DOM_VK_RETURN });

          expect(component.state.selection).toEqual(testplan.output);
        });
      });
    });

    describe('customListComponent', () => {
      beforeAll(function () {
        ListComponent = createReactClass({
          render() {
            return <div />;
          },
        });

        this.ListComponent = ListComponent;
      });

      beforeEach(() => {
        testContext.component = TestUtils.renderIntoDocument(
          <Typeahead
            options={BEATLES}
            customListComponent={testContext.ListComponent}
          />);
      });

      test('should not show the customListComponent when the input is empty', () => {
        // tslint:disable-next-line:max-line-length
        const results = TestUtils.scryRenderedComponentsWithType(testContext.component, testContext.ListComponent);
        expect(0).toEqual(results.length);
      });

      test('should show the customListComponent when the input is not empty', () => {
        const input = testContext.component.refs.entry;
        input.value = 'o';
        TestUtils.Simulate.change(input);
        // tslint:disable-next-line:max-line-length
        const results = TestUtils.scryRenderedComponentsWithType(testContext.component, testContext.ListComponent);
        expect(1).toEqual(results.length);
      });

      // tslint:disable-next-line:max-line-length
      test('should no longer show the customListComponent after an option has been selected', () => {
        const input = testContext.component.refs.entry;
        input.value = 'o';
        TestUtils.Simulate.change(input);
        TestUtils.Simulate.keyDown(input, { keyCode: Keyevent.DOM_VK_TAB });
        // tslint:disable-next-line:max-line-length
        const results = TestUtils.scryRenderedComponentsWithType(testContext.component, testContext.ListComponent);
        expect(0).toEqual(results.length);
      });
    });

    describe('textarea', () => {
      test('should render a <textarea> input', () => {
        const component = TestUtils.renderIntoDocument(
          <Typeahead
            options={BEATLES}
            textarea={true}
          />);

        const input = component.refs.entry;
        expect(input.tagName.toLowerCase()).toEqual('textarea');
      });

      test('should render a <input> input', () => {
        const component = TestUtils.renderIntoDocument(
          <Typeahead
            options={BEATLES}
          />);

        const input = component.refs.entry;
        expect(input.tagName.toLowerCase()).toEqual('input');
      });
    });

    describe('showOptionsWhenEmpty', () => {
      test('do not render options when value is empty by default', () => {
        const component = TestUtils.renderIntoDocument(
          <Typeahead
            options={BEATLES}
          />,
        );

        const results = TestUtils.scryRenderedComponentsWithType(component, TypeaheadOption);
        expect(0).toEqual(results.length);
      });

      test('do not render options when value is empty when set to true and not focused', () => {
        const component = TestUtils.renderIntoDocument(
          <Typeahead
            options={BEATLES}
            showOptionsWhenEmpty={true}
          />,
        );

        const results = TestUtils.scryRenderedComponentsWithType(component, TypeaheadOption);
        expect(0).toEqual(results.length);
      });

      test('render options when value is empty when set to true and focused', () => {
        const component = TestUtils.renderIntoDocument(
          <Typeahead
            options={BEATLES}
            showOptionsWhenEmpty={true}
          />,
        );

        TestUtils.Simulate.focus(component.refs.entry);
        const results = TestUtils.scryRenderedComponentsWithType(component, TypeaheadOption);
        expect(4).toEqual(results.length);
      });
    });
  });
});
