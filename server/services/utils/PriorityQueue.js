"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriorityQueue = void 0;
var PriorityQueue = /** @class */ (function () {
    function PriorityQueue(compare) {
        this.items = [];
        this.compare = compare;
    }
    PriorityQueue.prototype.enqueue = function (item) {
        this.items.push(item);
        this.bubbleUp(this.items.length - 1);
    };
    PriorityQueue.prototype.dequeue = function () {
        if (this.items.length === 0)
            return undefined;
        if (this.items.length === 1)
            return this.items.pop();
        var top = this.items[0];
        this.items[0] = this.items.pop();
        this.bubbleDown(0);
        return top;
    };
    PriorityQueue.prototype.size = function () {
        return this.items.length;
    };
    PriorityQueue.prototype.isEmpty = function () {
        return this.items.length === 0;
    };
    PriorityQueue.prototype.peek = function () {
        return this.items[0];
    };
    PriorityQueue.prototype.bubbleUp = function (index) {
        while (index > 0) {
            var parentIndex = Math.floor((index - 1) / 2);
            if (this.compare(this.items[index], this.items[parentIndex]) <= 0)
                break;
            this.swap(index, parentIndex);
            index = parentIndex;
        }
    };
    PriorityQueue.prototype.bubbleDown = function (index) {
        while (true) {
            var leftChild = 2 * index + 1;
            var rightChild = 2 * index + 2;
            var largest = index;
            if (leftChild < this.items.length &&
                this.compare(this.items[leftChild], this.items[largest]) > 0) {
                largest = leftChild;
            }
            if (rightChild < this.items.length &&
                this.compare(this.items[rightChild], this.items[largest]) > 0) {
                largest = rightChild;
            }
            if (largest === index)
                break;
            this.swap(index, largest);
            index = largest;
        }
    };
    PriorityQueue.prototype.swap = function (i, j) {
        var _a;
        _a = [this.items[j], this.items[i]], this.items[i] = _a[0], this.items[j] = _a[1];
    };
    return PriorityQueue;
}());
exports.PriorityQueue = PriorityQueue;
