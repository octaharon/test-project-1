require('../sass/ItemList.scss');
import React from 'react';

/**
 * @property list
 * @property title
 * @property onAddToList
 * @property onRemoveFromList
 */
class ItemList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            newValue: '',
            canAdd: false
        };
    }


    onChange(e) {
        let value = e.target.value = e.target.value.trim().toLowerCase();
        this.setState({
            newValue: value,
            canAdd: value.length > 0 && !this.isInList(value)
        });
    }

    newItem(e) {
        if (this.state.canAdd && this.props.onAddToList instanceof Function)
            if (this.props.onAddToList(this.state.newValue) !== false) {
                this.setState({newValue: ''});
            }
        return false;
    }

    removeItem(value) {
        if (this.props.onRemoveFromList instanceof Function)
            this.props.onRemoveFromList(value);
    }


    render() {
        let listItems = this.props.list.map((value) =>
            <li className="tag">
                <a href="javascript:;" className="fa fa-times"
                   onClick={this.removeItem.bind(this, value)}>&nbsp;</a>
                <span>{value}</span>
            </li>
        );
        return (
            <div className="item-list">
                <div className="item-list-title">{this.props.title}</div>
                <div className="item-list-add">
                    <label>Add new: <input type="text" value={this.state.newValue} onChange={this.onChange.bind(this)}/></label>
                    {this.state.canAdd &&
                    <a href="javascript:;" className="fa fa-plus" onClick={this.newItem.bind(this)}>&nbsp;</a>
                    }
                </div>
                <div className="item-list-items">
                    {this.props.list.length ? (
                            <ul>{listItems}</ul>
                        ) : (
                            <span class="empty">List is empty</span>
                        )
                    }
                </div>
            </div>
        );
    }


}

export default ItemList;

