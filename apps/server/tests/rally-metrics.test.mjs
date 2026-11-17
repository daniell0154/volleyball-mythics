import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RallyMetrics} from '../dist/runtime/rallyMetrics.js';
test('rally metrics keep bounded aggregates, not raw inputs or identities',()=>{
 const metrics=new RallyMetrics();metrics.serve(100);
 metrics.attempt(1);metrics.attempt(3);metrics.rejectedRange();metrics.contact(false);metrics.contact(true);
 assert.deepEqual(metrics.finish('2v2',1,2,220,'ground'),{mode:'2v2',rulesVersion:1,rallyId:2,served:true,durationSeconds:2,contactsAfterServe:2,returnedServe:true,rangeRejections:1,attempts:2,inputDelayTicksP95:3,reason:'ground'});
 assert.equal(new RallyMetrics().finish('1v1',1,1,480,'serve_timeout').served,false);
});
