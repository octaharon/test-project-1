require('../sass/MatchGroup.scss');

import React from 'react';
import PropTypes from 'prop-types';
import update from 'immutability-helper';
import ItemList from './ItemList';


const propTypes = {
    name: PropTypes.string.isRequired,
    expanded: PropTypes.bool,
    twitterList: PropTypes.array,
    instagramList: PropTypes.array,
    keywords: PropTypes.array,
    onChange: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired
};


/**
 * @property name
 * @property expanded
 * @property twitterList
 * @property instagramList
 * @property keywords
 * @property onChange
 * @property onDelete
 */
class MatchGroup extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name: this.props.name,
            twInfluencers: this.props.twitterList || [],
            igInfluencers: this.props.instagramList || [],
            keywords: this.props.keywords || [],
            expanded: this.props.expanded || false,
            revalidate: false,
            invalid: false
        };

        //explicitly creating methods for updating particular lists
        this.addToKeywords = this.addToList.bind(this, 'keywords');
        this.removeFromKeywords = this.removeFromList.bind(this, 'keywords');
        this.addToTwitter = this.addToList.bind(this, 'twInfluencers');
        this.removeFromTwitter = this.removeFromList.bind(this, 'twInfluencers');
        this.addToInstagram = this.addToList.bind(this, 'igInfluencers');
        this.removeFromInstagram = this.removeFromList.bind(this, 'igInfluencers');
        this.validateKeywords = (value) => value.toString().length > 0 && !this.isInList('keywords', value);
        this.validateTwitter = (value) => value.toString().length > 0 && !this.isInList('twInfluencers', value);
        this.validateInstagram = (value) => value.toString().length > 0 && !this.isInList('igInfluencers', value);
    }

    //fast comparison of scalar arrays. returns true if they are equal
    comparePlainArrays(a, b) {
        if (a instanceof Array && b instanceof Array) {
            let a1 = a.slice();
            let b1 = b.slice();
            return a1.sort().toString() == b1.sort().toString();
        }
        return false;

    }

    componentWillReceiveProps(nextProps) {
        let {name, twitterList, instagramList, keywords}=nextProps;
        let toChange = {};
        if (name != this.state.name)
            toChange.name = {$set: name};
        if (!this.comparePlainArrays(this.state.keywords, keywords))
            toChange.keywords = {$set: keywords};
        if (!this.comparePlainArrays(this.state.twInfluencers, twitterList))
            toChange.twInfluencers = {$set: twitterList};
        if (!this.comparePlainArrays(this.state.igInfluencers, instagramList))
            toChange.igInfluencers = {$set: instagramList};
        if (Object.keys(toChange).length)
            this.setState((state) => update(state, toChange), this.setState({revalidate: false}));
    }


    addToList(listKey, item) {
        item = item.toString().trim();
        if (this.isInList(listKey, item))
            return false;
        this.setState((state) => update(state, {
            [listKey]: {$push: [item]}
        }), this.autosave.bind(this, true));
        return this;
    }


    isInList(listKey, item) {
        item = item.toString().trim();
        return item.length && this.state[listKey] instanceof Array && this.state[listKey].indexOf(item) > -1;
    }

    removeFromList(listKey, item) {
        if (!this.state[listKey] instanceof Array)
            return false;
        let pos = this.state[listKey].indexOf(item);
        if (pos == -1)
            return false;
        let newList = this.state[listKey].slice();
        newList.splice(pos, 1);
        if (!newList.length && (
                listKey == 'igInfluencers' && !this.state.twInfluencers.length || listKey == 'twInfluencers' && !this.state.igInfluencers.length
            )) {
            if (window.confirm(`You're about to remove the last influencer in this group, this will remove the group itself. Commit with removal?`)) {
                return this.removeGroup(undefined, true);
            }
            return false;
        }

        this.setState((state) => update(state, {
            [listKey]: {$set: newList}
        }), this.autosave.bind(this, true));
        return true;
    }

    onNameChange(e) {
        let name = e.target.value.replace(/^\s+/, '');
        this.setState({name, revalidate: true, invalid: name.length==0});
    }

    removeGroup(e, force) {
        if (this.props.onDelete instanceof Function) {
            if (force == true || window.confirm(`Delete group "${this.state.name}"?`))
                return this.props.onDelete();
        }
        return false;
    }

    toggle() {
        this.setState({
            expanded: !this.state.expanded
        });
    }

    keyHandler(e) {
        if (e.keyCode == 13) {
            e.preventDefault();
            this.autosave(e);
        }
    }

    autosave(force) {
        let name = this.state.name.trim();
        if (name.length && this.props.onChange instanceof Function && (this.state.revalidate || force == true))
            this.setState({name}, () => {
                if (this.props.onChange(this.state) === false)
                    this.setState({invalid: true, revalidate: true});
                else
                    this.setState({invalid: false, revalidate: false});
            });
    }

    render() {
        return (
            <div className="match-group">
                <div className="match-group-title">
                    <label>
                        <span
                            className={"fa " + (this.state.expanded ? "fa-caret-down" : "fa-caret-right")}
                            onClick={this.toggle.bind(this)}>
                        </span>
                        <input type="text" className={(this.state.invalid ? 'error' : '')} value={this.state.name}
                               onChange={this.onNameChange.bind(this)}
                               onKeyDown={this.keyHandler.bind(this)}
                               onBlur={this.autosave.bind(this)}/>
                        <span className="nowrap">
                        <a href="javascript:;" title="delete group"
                           className="fa fa-trash-o" tabIndex={-1}
                           onClick={this.removeGroup.bind(this)}>&nbsp;</a>
                        <a href="javascript:;" title={this.state.expanded ? "Collapse contents" : "Show contents"}
                           tabIndex={-1}
                           className={"fa " + (this.state.expanded ? "fa-folder-open-o" : "fa-folder-o")}
                           onClick={this.toggle.bind(this)}>&nbsp;</a>
                        </span>
                    </label>

                </div>
                <div className="match-group-items" style={this.state.expanded ? {} : {display: 'none'}}>
                    <ItemList title="Twitter influencers" list={this.state.twInfluencers}
                              spacesAllowed={false}
                              onAddToList={this.addToTwitter}
                              onRemoveFromList={this.removeFromTwitter}
                              onValidate={this.validateTwitter.bind(this)}
                    />
                    <ItemList title="Instagram influencers" list={this.state.igInfluencers}
                              spacesAllowed={false}
                              onAddToList={this.addToInstagram}
                              onRemoveFromList={this.removeFromInstagram}
                              onValidate={this.validateInstagram.bind(this)}
                    />
                    <ItemList title="Keywords" list={this.state.keywords}
                              onAddToList={this.addToKeywords}
                              onRemoveFromList={this.removeFromKeywords}
                              onValidate={this.validateKeywords.bind(this)}
                    />
                </div>
            </div>
        );
    }


}

MatchGroup.propTypes = propTypes;

export default MatchGroup;

