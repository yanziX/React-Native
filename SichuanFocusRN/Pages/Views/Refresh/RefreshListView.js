import React, {Component} from 'react';
import {FlatList} from 'react-native';
import ProTypes from 'prop-types';
import RefreshState from './RefreshState'
import RefreshFooter from './RefreshFooter'

export default class RefreshListView extends Component {

    static propTypes = {
        onHeaderRefresh: ProTypes.func,  //下拉刷新的方法
        onFooterRefresh: ProTypes.func,  //上拉加载的方法
    };

    constructor(props) {
        super(props);
        this.state = {
            isHeaderRefreshing: false,  //头部是否正在刷新
            isFooterRefreshing: false,
            footerState: RefreshState.Idle
        }
    }

    render() {
        return (
            <FlatList
                {...this.props}
                onRefresh={()=>{ this.beginHeaderRefresh() }}
                refreshing={this.state.isHeaderRefreshing}
                onEndReached={() => {this.beginFooterRefresh()}}
                onEndReachedThreshold={0.1} //这里取值0.1，可以根据实际情况调整，取值尽量小
                ListFooterComponent={this._renderFooter}
            ></FlatList>
        )
    }


    _renderFooter = () => {
        return (
            <RefreshFooter
                state={this.state.footerState}
                onRetryLoading={()=>{
                    this.beginFooterRefresh()
                }}
            />
        )
    }

    ///尾部组件的状态，供外部调用，一般不会用到
    footerState() {
        return this.state.footerState;
    }

    ///开始下拉刷新
    beginHeaderRefresh() {
        if (this.shouldStartHeaderRefreshing()) {
            this.startHeaderRefreshing();
        }
    }

    ///开始上拉加载更多
    beginFooterRefresh() {
        if (this.shouldStartFooterRefreshing()) {
            this.startFooterRefreshing();
        }
    }

    ///下拉刷新，设置完刷新状态后再调用刷新方法，使页面上可以显示出加载中的UI，注意这里setState写法
    startHeaderRefreshing() {
        this.setState(
            {
                isHeaderRefreshing: true
            },
            () => {
                this.props.onHeaderRefresh && this.props.onHeaderRefresh()
            }
        );
    }

    /**
     * 上拉加载更多，将底部刷新状态改为正在刷新，然后调用刷新方法，页面上可以显示出加载中的UI，注意这里setState写法
     */
    startFooterRefreshing() {
        this.setState(
            {
             footerState: RefreshState.Refreshing,
             isFooterRefreshing: true
            },
            () => {
             this.props.onFooterRefresh && this.props.onFooterRefresh();
             }
        )
    }

    /**
     * 当前是否可以进行下拉刷新
     * @returns {boolean}
     * 
     * 如果列表尾部正在执行上拉加载，就返回false
     * 如果列表头部已经在刷新中了，就返回false
     */
    shouldStartHeaderRefreshing() {
        if (this.state.footerState == RefreshState.Refreshing ||
            this.state.isHeaderRefreshing ||
            this.state.isFooterRefreshing) {
                return false;
            }
            return true;
    }

    /**
     * 当前是否可以进行上拉加载更多
     * @returns {boolean}
     * 
     * 如果底部已经在刷新，返回false
     * 如果底部状态是没有更多数据了，返回false
     * 如果头部在刷新，则返回false
     * 如果列表数据为空，则返回false（初始状态下列表是空的，这时候肯定不需要上拉加载更多，而应该执行下拉刷新）
     */
    shouldStartFooterRefreshing() {
        if (this.state.footerState === RefreshState.Refreshing ||
            this.state.footerState === RefreshState.NoMoreData ||
            this.props.data.length === 0 ||
            this.state.isHeaderRefreshing ||
            this.state.isFooterRefreshing) {
                return false;
            }
            return true;
    }

    /**
     * 根据尾部组件状态来停止刷新
     * @param  footerState 
     * 
     * 如果刷新完成，当前列表数据源是空的，就不显示尾部组件了
     * 这里这样做是因为通常列表无数据时，我们会显示一个空白页，如果再显示尾部组件如“没有更多数据了”就显得很多余
     */
    endRefreshing(footerState: RefreshState) {
        let footerRefreshState = footerState;
        if (this.props.data.length === 0) {
            footerRefreshState = RefreshState.Idle;
        }
        this.setState({
            footerState: footerRefreshState,
            isHeaderRefreshing: false,
            isFooterRefreshing: false
        })
    }
}