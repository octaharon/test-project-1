require('../sass/GroupList.scss');

import React from 'react';
import _ from 'underscore';
import update from 'immutability-helper';
import MatchGroup from './MatchGroup';

/**
 * @property UUID
 */
class GroupList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            newGroupName: '',
            canAdd: false,
            twitterGroups: [],
            instagramGroups: []
        };
    }

    componentWillMount() {
        //@todo request api here
    }

    newGroup(e) {
        if (!this.state.newGroupName.length || this.groupExists(this.state.newGroupName))
            return false;

    }

    groupExists(groupName) {
        if (_.findWhere(this.state.instagramGroups, {name: groupName}) !== undefined)
            return true;
        return (_.findWhere(this.state.twitterGroups, {name: groupName}) !== undefined)
    }

    onGroupNameChange(e) {
        let newGroupName = e.target.value.trim();
        this.setState({
            newGroupName,
            canAdd: newGroupName.length > 0 && !this.groupExists(newGroupName)
        });
    }

    onGroupDelete(groupName) {
        this.setState((state) => update(state, {
            twitterGroups: {$set: _.reject(this.state.twitterGroups, group => (group.name == groupName))},
            instagramGroups: {$set: _.reject(this.state.instagramGroups, group => (group.name == groupName))}
        }));
        this.autosave();
    }


    /**
     * @return {name, twitterList, instagramList, keywords}...
     */
    getMergedGroups() {
        let r = [];
        for (group of this.state.instagramGroups) {
            r.push({
                name: group.name,
                instagramList: group.influencers,
                twitterList: [],
                keywords: group.keywords
            });
        }
        for (group of this.state.twitterGroups) {
            let mergedGroup = _.findWhere(r, {name: group.name});
            if (mergedGroup !== undefined) {
                mergedGroup.twitterList = group.influencers;
                mergedGroup.keywords = _.uniq([...mergedGroup.keywords, ...group.keywords], false, str => str.toLowerCase())
            }
            else
                r.push({
                    name: group.name,
                    instagramList: [],
                    twitterList: group.influencers,
                    keywords: group.keywords
                });
        }
        return r;
    }

    autosave(groupName = undefined, newData = null) {
        //@todo api save data
    }

    render() {

        let listItems = this.getMergedGroups().map((value) =>
                <MatchGroup name={value.name} twitterList={value.twitterList} instagramList={value.instagramList}
                            keywords={value.keywords} onChange={this.autosave.bind(this, value.name)}
                            onDelete={this.onGroupDelete.bind(this, value.name)}/>
            ) || '';

        return (
            <div className="match-group-list">
                <div className="match-group-new">
                    <label>New group:</label>
                    <input type="text" value={this.state.newGroupName} onChange={this.onGroupNameChange.bind(this)}/>
                    { this.state.canAdd &&
                    <a href="javascript:;" className="fa fa-plus-circle" onClick={this.newGroup.bind(this)}>&nbsp;</a>
                    }
                </div>
                <div className="match-group-list">
                    {listItems}
                </div>
            </div>
        );
    }


}

export default GroupList;

