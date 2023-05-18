import React, { PureComponent } from "react";

import Dropdown from "./DropdownV2";
import TextInput from "./TextInput";
import getLanguage from "getLanguage.js";
import languages from "views/Conversation/languages";
import {Tooltip} from "antd";

import "./SelectDropdown.scss";

/*
	props:
    - options list(obj): options to be displayed
    - categories list(obj): categories of the menus 
		- noSelectionTitle str: text to be displayed when empty
		- display function(obj) -> str|Component: a map between an object an its display
		- onSelect function([obj]): to be called when an option is clicked, it calls all the clicked objects
    - hideOnOptionClick bool: Determine whether to hide the drowpdown when an option is clicked
    - menuWidth int: width of the menu
    - buttonWidth int: width of the button
    - className str: class to pass on for further control of the menu
    - direction str: direction to place the menu (Default:down)
    - value (obj | str): initialize dropdown with the option selected
    - dropdownIcon
*/

export default class SelectHSMDropdown extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      open: false,
      selectedOption: this.props.value ? this.props.value : null,
      searchText: "",

    };
  }

  language = languages[getLanguage()];

  componentDidUpdate = (prevProps) => {
    if (prevProps.value != this.props.value) {
      this.setState({ selectedOption: this.props.value });
    }
  };

  selectOption = (option, trigger) => {
    let close = trigger(option);

    this.setState({ selectedOption: option });

    if (typeof close === "boolean") {
      this.setState({ open: !close });
      this.drowpdownRef.instanceRef.toggle(!close);
      return;
    }

    if (this.props.hideOnOptionClick === false) return;
  };

  getfilteredOptions = () => {
    let searchText = this.state.searchText.toLowerCase();
    let { options } = this.props;

    // no searching
    if (!searchText) return this.props.options;

    // use toSearchStr function is available, otherwise use a default function
    let toSearchStr = this.props.toSearchStr;
    if (typeof this.props.toSearchStr !== "function") {
      try {
        let defaultToSearchStr = (option) => String(option);
        let optionsStr = options.map(defaultToSearchStr);
        toSearchStr = defaultToSearchStr;
      } catch (err) {
        throw "'filterBy' property must be provided";
      }
    }

    // filter by str contained
    return options.filter((option) =>
      toSearchStr(option).toLowerCase().includes(searchText)
    );
  };

  displayTitle = () => {
    if (this.state.selectedOption == null) {
      return "";
    }
    
    if (typeof this.props.display === "function")
      return this.props.display(this.state.selectedOption);

    return this.state.selectedOption;
  };

  displayItem = (item) => {
    if (typeof this.props.display == "function")
      return this.props.display(item);
    if (typeof item === "string") return <p className="r lh-22">{item}</p>;
    else return item;
  };

  renderSearchbar = () => {
    return (
        <div className="searchbar" onClick={(e) => e.stopPropagation()}>
          <div className={`control ${this.state.searchText === "" ? 'has-icons-left' : ''} has-icons-right`}>
            { this.state.searchText === "" ?
              <span className="icon is-small is-left" style={{color: "#767676"}}>
                <i className="fas fa-search"></i>
              </span> : 
              <span 
                className="icon is-small is-right white" 
                style={{color: "#F1F2F2", cursor: "pointer"}}
              >
                <i className="fas fa-times-circle"/>
              </span>
            }
            <TextInput
              className="input"
              type="text"
              onChange={({ target: { value } }) => {
                  this.setState({ searchText: value });
              }}
              value={this.state.searchText}
              trackMessage="Search HSM to make second HSM message"
              placeholder={this.language.hsmPH}
            />
          </div>
        </div>
    );
  };

  render = () => {
    let onSelect = this.props.onSelect;
    let hideOnOptionClick =
      this.props.hideOnOptionClick === false ? false : true;
    let hideOnClickOutside =
      this.props.hideOnClickOutside === false ? false : true;

    if (typeof onSelect !== "function") onSelect = () => {};

    const options = this.getfilteredOptions();
    return (
      <div>
        <Dropdown
          title={this.displayTitle()}
          hideOnBodyClick={hideOnOptionClick}
          // hideOnClickOutside={hideOnClickOutside}
          triggerComponent={this.props.triggerComponent}
          menuWidth={this.props.menuWidth}
          buttonWidth={this.props.buttonWidth}
          direction={this.props.direction}
          className={this.props.className}
          subClassName={this.props.subClassName}
          dropdownIcon={this.props.dropdownIcon}
          ref={(drowpdownRef) => (this.drowpdownRef = drowpdownRef)}
          className="hsm-select-dropdown"
        > 
          {this.renderSearchbar()}
          <div className="dropdown-options" >
            {options.length > 0 ? options.map((e) => {
              return (
                <Tooltip
                    overlayClassName={`hsm ${e.status}`}
                    placement="rightBottom"
                    title={this.props.renderHsmTooltip(e)}
                >
                  <div
                    key={this.props.options.indexOf(e)}
                    className="dropdown-item"
                    onClick={() => {
                      this.selectOption(e, onSelect);
                    }}
                  >
                    {this.displayItem(e)}
                  </div>
                </Tooltip>
              )}) : 
                <div className="dropdown-item no-results" onClick={(e) => e.stopPropagation()}>
                  {this.displayItem({name: "", content: this.language.secondHSMSelectNoResultsMessage})}
                </div>}
          </div>
        </Dropdown>
      </div>
    );
  };
}