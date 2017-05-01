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
            revalidate: false
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
        return item.toString().length && this.state[listKey] instanceof Array && this.state[listKey].indexOf(item) > -1;
    }

    removeFromList(listKey, item) {
        if (!this.state[listKey] instanceof Array)
            return false;
        let pos = this.state[listKey].indexOf(item);
        if (pos == -1)
            return false;
        let newList = this.state[listKey].slice();
        newList.splice(pos, 1);
        this.setState((state) => update(state, {
            [listKey]: {$set: newList}
        }), this.autosave.bind(this, true));
        return this;
    }

    onNameChange(e) {
        let name = e.target.value.replace(/^\s+/, '');
        if (!name.length)
            return false;
        this.setState({name, revalidate: true});
    }

    removeGroup(e) {
        e.preventDefault();
        if (this.props.onDelete instanceof Function) {
            if (window.confirm("Delete group " + this.state.name))
                return this.props.onDelete();
        }
        return false;
    }

    toggle() {
        this.setState({
            expanded: !this.state.expanded
        });
    }

    autosave(force) {
        let name = this.state.name.trim();
        if (name.length && this.props.onChange instanceof Function && (this.state.revalidate || force == true))
            this.setState({revalidate: false, name}, this.props.onChange(this.state));
    }

    render() {
        return (
            <div className="match-group">
                <div className="match-group-title">
                    <label>
                        <span
                            className={"fa " + (this.state.expanded ? "fa-caret-down" : "fa-caret-right")}>&nbsp;</span>
                        <input type="text" className={(!this.state.name.length ? 'error' : '')} value={this.state.name}
                               onChange={this.onNameChange.bind(this)} onBlur={this.autosave.bind(this)}/>
                        <a href="javascript:;" title="delete group" className="fa fa-trash-o"
                           onClick={this.removeGroup.bind(this)}>&nbsp;</a>
                        <a href="javascript:;" title={this.state.expanded ? "Collapse contents" : "Show contents"}
                           className={"fa " + (this.state.expanded ? "fa-folder-open-o" : "fa-folder-o")}
                           onClick={this.toggle.bind(this)}>&nbsp;</a>
                    </label>

                </div>
                <div className="match-group-items" style={this.state.expanded ? {} : {display: 'none'}}>
                    <ItemList title="Twitter influencers" list={this.state.twInfluencers}
                              onAddToList={this.addToTwitter}
                              onRemoveFromList={this.removeFromTwitter}
                              onValidate={this.validateTwitter.bind(this)}
                    />
                    <ItemList title="Instagram influencers" list={this.state.igInfluencers}
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

