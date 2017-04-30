require('../sass/MatchGroup.scss');

import React from 'react';
import ItemList from './ItemList';
import update from 'immutability-helper';

/**
 * @property name
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
            twInfluencers: null,
            igInfluencers: null,
            keywords: null
        };

        //explicitly creating methods for updating particular lists
        this.addToKeywords = this.addToList.bind(this, 'keywords');
        this.removeFromKeywords = this.removeFromList.bind(this, 'keywords');
        this.addToTwitter = this.addToList.bind(this, 'twInfluencers');
        this.removeFromTwitter = this.removeFromList.bind(this, 'twInfluencers');
        this.addToInstagram = this.addToList.bind(this, 'igInfluencers');
        this.removeFromInstagram = this.removeFromList.bind(this, 'igInfluencers');
    }

    componentWillMount() {
        this.setState({
            name: this.props.name,
            twInfluencers: this.props.twitterList,
            igInfluencers: this.props.instagramList,
            keywords: this.props.keywords
        });
    }


    addToList(listKey, item) {
        item = item.toString().trim();
        if (this.isInList(listKey, item))
            return false;
        this.setState((state) => update(state, {
            [listKey]: {$push: [item]}
        }));
        this.autosave();
        return this;
    }


    isInList(listKey, item) {
        return this.state[listKey] instanceof Array && this.state[listKey].indexOf(item) > -1;
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
        }));
        this.autosave();
        return this;
    }

    onNameChange(e) {
        let name = e.target.value.trim();
        this.setState({name});
    }

    removeGroup()
    {
        if (this.props.onDelete instanceof Function)
            return this.props.onDelete();
    }

    autosave() {
        if (this.state.name.length && this.props.onChange instanceof Function)
            return this.props.onChange(this.state);
    }

    render() {
        return (
            <div className="match-group">
                <div className="match-group-title">
                    <label>Group title</label>
                    <input type="text" className={(!this.state.name.length ? 'error' : '')} value={this.state.name}
                           onChange={this.onNameChange.bind(this)} onBlur={this.autosave.bind(this)}/> <a href="javascript:;" className="fa fa-remove" onClick={this.removeGroup.bind(this)} >&nbsp;</a>"
                </div>
                <ItemList title="Twitter influencers" list={this.state.twInfluencers} onAddToList={this.addToTwitter}
                          onRemoveFromList={this.removeFromTwitter}/>
                <ItemList title="Instagram influencers" list={this.state.igInfluencers}
                          onAddToList={this.addToInstagram}
                          onRemoveFromList={this.removeFromInstagram}/>
                <ItemList title="Keywords" list={this.state.keywords} onAddToList={this.addToKeywords}
                          onRemoveFromList={this.removeFromKeywords}/>
            </div>
        );
    }


}

export default MatchGroup;

