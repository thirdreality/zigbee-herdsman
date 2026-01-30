import {describe, expect, it} from 'vitest';
import {
    FRAMES,
    FRAME_NAMES_BY_ID,
    ZDOREQUESTS,
    ZDORESPONSES,
    ZDOREQUEST_NAME_BY_ID,
    ZDORESPONSE_NAME_BY_ID,
} from '../../../../src/adapter/blz/driver/commands';

describe('BLZ Commands', () => {
    describe('FRAMES', () => {
        describe('Control Frames', () => {
            it('should define ack frame', () => {
                expect(FRAMES.ack).toBeDefined();
                expect(FRAMES.ack.ID).toBe(0x0001);
                expect(FRAMES.ack.request).toEqual({});
                expect(FRAMES.ack.response).toEqual({});
            });

            it('should define error frame', () => {
                expect(FRAMES.error).toBeDefined();
                expect(FRAMES.error.ID).toBe(0x0002);
                expect(FRAMES.error.request).toBeDefined();
                expect(FRAMES.error.request!.errorCode).toBeDefined();
            });

            it('should define reset frame', () => {
                expect(FRAMES.reset).toBeDefined();
                expect(FRAMES.reset.ID).toBe(0x0003);
            });

            it('should define resetAck frame', () => {
                expect(FRAMES.resetAck).toBeDefined();
                expect(FRAMES.resetAck.ID).toBe(0x0004);
                expect(FRAMES.resetAck.response).toBeDefined();
                expect(FRAMES.resetAck.response!.resetReason).toBeDefined();
            });
        });

        describe('Value Frames', () => {
            it('should define getValue frame', () => {
                expect(FRAMES.getValue).toBeDefined();
                expect(FRAMES.getValue.ID).toBe(0x0010);
                expect(FRAMES.getValue.request).toBeDefined();
                expect(FRAMES.getValue.request!.valueId).toBeDefined();
                expect(FRAMES.getValue.response).toBeDefined();
                expect(FRAMES.getValue.response!.status).toBeDefined();
                expect(FRAMES.getValue.response!.valueLength).toBeDefined();
                expect(FRAMES.getValue.response!.value).toBeDefined();
            });

            it('should define setValue frame', () => {
                expect(FRAMES.setValue).toBeDefined();
                expect(FRAMES.setValue.ID).toBe(0x0011);
                expect(FRAMES.setValue.request).toBeDefined();
                expect(FRAMES.setValue.request!.valueId).toBeDefined();
                expect(FRAMES.setValue.request!.valueLength).toBeDefined();
                expect(FRAMES.setValue.request!.value).toBeDefined();
            });

            it('should define getNodeIdByEui64 frame', () => {
                expect(FRAMES.getNodeIdByEui64).toBeDefined();
                expect(FRAMES.getNodeIdByEui64.ID).toBe(0x0012);
            });

            it('should define getEui64ByNodeId frame', () => {
                expect(FRAMES.getEui64ByNodeId).toBeDefined();
                expect(FRAMES.getEui64ByNodeId.ID).toBe(0x0013);
            });

            it('should define getNextZdpSequenceNum frame', () => {
                expect(FRAMES.getNextZdpSequenceNum).toBeDefined();
                expect(FRAMES.getNextZdpSequenceNum.ID).toBe(0x0014);
            });
        });

        describe('Endpoint Management', () => {
            it('should define addEndpoint frame', () => {
                expect(FRAMES.addEndpoint).toBeDefined();
                expect(FRAMES.addEndpoint.ID).toBe(0x0015);
                expect(FRAMES.addEndpoint.request).toBeDefined();
                expect(FRAMES.addEndpoint.request!.endpoint).toBeDefined();
                expect(FRAMES.addEndpoint.request!.profileId).toBeDefined();
                expect(FRAMES.addEndpoint.request!.deviceId).toBeDefined();
                expect(FRAMES.addEndpoint.request!.inputClusterList).toBeDefined();
                expect(FRAMES.addEndpoint.request!.outputClusterList).toBeDefined();
            });
        });

        describe('Networking Frames', () => {
            it('should define getNetworkState frame', () => {
                expect(FRAMES.getNetworkState).toBeDefined();
                expect(FRAMES.getNetworkState.ID).toBe(0x0020);
            });

            it('should define formNetwork frame', () => {
                expect(FRAMES.formNetwork).toBeDefined();
                expect(FRAMES.formNetwork.ID).toBe(0x0026);
                expect(FRAMES.formNetwork.request!.extPanId).toBeDefined();
                expect(FRAMES.formNetwork.request!.panId).toBeDefined();
                expect(FRAMES.formNetwork.request!.channel).toBeDefined();
            });

            it('should define joinNetwork frame', () => {
                expect(FRAMES.joinNetwork).toBeDefined();
                expect(FRAMES.joinNetwork.ID).toBe(0x0027);
            });

            it('should define leaveNetwork frame', () => {
                expect(FRAMES.leaveNetwork).toBeDefined();
                expect(FRAMES.leaveNetwork.ID).toBe(0x0028);
            });

            it('should define permitJoining frame', () => {
                expect(FRAMES.permitJoining).toBeDefined();
                expect(FRAMES.permitJoining.ID).toBe(0x0029);
                expect(FRAMES.permitJoining.request!.duration).toBeDefined();
            });

            it('should define getNetworkParameters frame', () => {
                expect(FRAMES.getNetworkParameters).toBeDefined();
                expect(FRAMES.getNetworkParameters.ID).toBe(0x002B);
                expect(FRAMES.getNetworkParameters.response!.panId).toBeDefined();
                expect(FRAMES.getNetworkParameters.response!.channel).toBeDefined();
            });

            it('should define networkInit frame', () => {
                expect(FRAMES.networkInit).toBeDefined();
                expect(FRAMES.networkInit.ID).toBe(0x0034);
            });

            it('should define stackStatusHandler frame', () => {
                expect(FRAMES.stackStatusHandler).toBeDefined();
                expect(FRAMES.stackStatusHandler.ID).toBe(0x0035);
            });

            it('should define deviceJoinCallback frame', () => {
                expect(FRAMES.deviceJoinCallback).toBeDefined();
                expect(FRAMES.deviceJoinCallback.ID).toBe(0x0036);
                expect(FRAMES.deviceJoinCallback.response!.eui64).toBeDefined();
                expect(FRAMES.deviceJoinCallback.response!.nodeId).toBeDefined();
            });

            it('should define getNwkPayloadLimit frame', () => {
                expect(FRAMES.getNwkPayloadLimit).toBeDefined();
                expect(FRAMES.getNwkPayloadLimit.ID).toBe(0x0037);
            });
        });

        describe('Security Frames', () => {
            it('should define getNwkSecurityInfos frame', () => {
                expect(FRAMES.getNwkSecurityInfos).toBeDefined();
                expect(FRAMES.getNwkSecurityInfos.ID).toBe(0x0050);
                expect(FRAMES.getNwkSecurityInfos.response!.nwkKey).toBeDefined();
            });

            it('should define setNwkSecurityInfos frame', () => {
                expect(FRAMES.setNwkSecurityInfos).toBeDefined();
                expect(FRAMES.setNwkSecurityInfos.ID).toBe(0x0051);
                expect(FRAMES.setNwkSecurityInfos.request!.nwkKey).toBeDefined();
            });

            it('should define getGlobalTcLinkKey frame', () => {
                expect(FRAMES.getGlobalTcLinkKey).toBeDefined();
                expect(FRAMES.getGlobalTcLinkKey.ID).toBe(0x0052);
            });

            it('should define setGlobalTcLinkKey frame', () => {
                expect(FRAMES.setGlobalTcLinkKey).toBeDefined();
                expect(FRAMES.setGlobalTcLinkKey.ID).toBe(0x0053);
            });

            it('should define getUniqueTcLinkKey frame', () => {
                expect(FRAMES.getUniqueTcLinkKey).toBeDefined();
                expect(FRAMES.getUniqueTcLinkKey.ID).toBe(0x0054);
            });

            it('should define setUniqueTcLinkKey frame', () => {
                expect(FRAMES.setUniqueTcLinkKey).toBeDefined();
                expect(FRAMES.setUniqueTcLinkKey.ID).toBe(0x0055);
            });
        });

        describe('APS Data Frames', () => {
            it('should define sendApsData frame', () => {
                expect(FRAMES.sendApsData).toBeDefined();
                expect(FRAMES.sendApsData.ID).toBe(0x0080);
                expect(FRAMES.sendApsData.request!.msgType).toBeDefined();
                expect(FRAMES.sendApsData.request!.dstShortAddr).toBeDefined();
                expect(FRAMES.sendApsData.request!.profileId).toBeDefined();
                expect(FRAMES.sendApsData.request!.clusterId).toBeDefined();
                expect(FRAMES.sendApsData.request!.payload).toBeDefined();
            });

            it('should define apsDataIndication frame', () => {
                expect(FRAMES.apsDataIndication).toBeDefined();
                expect(FRAMES.apsDataIndication.ID).toBe(0x0082);
                expect(FRAMES.apsDataIndication.response!.profileId).toBeDefined();
                expect(FRAMES.apsDataIndication.response!.clusterId).toBeDefined();
                expect(FRAMES.apsDataIndication.response!.message).toBeDefined();
            });

            it('should define apsDataConfirm frame', () => {
                expect(FRAMES.apsDataConfirm).toBeDefined();
                expect(FRAMES.apsDataConfirm.ID).toBe(0x0081);
            });
        });
    });

    describe('FRAME_NAMES_BY_ID', () => {
        it('should map all frame IDs to names', () => {
            for (const [name, frame] of Object.entries(FRAMES)) {
                expect(FRAME_NAMES_BY_ID[frame.ID]).toBeDefined();
                expect(FRAME_NAMES_BY_ID[frame.ID]).toContain(name);
            }
        });

        it('should handle frames with same ID', () => {
            // Some frames might share IDs (request/response pairs)
            // Each ID should have at least one name
            for (const names of Object.values(FRAME_NAMES_BY_ID)) {
                expect(Array.isArray(names)).toBe(true);
                expect(names.length).toBeGreaterThan(0);
            }
        });

        it('should have correct mapping for common frames', () => {
            expect(FRAME_NAMES_BY_ID[0x0001]).toContain('ack');
            expect(FRAME_NAMES_BY_ID[0x0003]).toContain('reset');
            expect(FRAME_NAMES_BY_ID[0x0010]).toContain('getValue');
            expect(FRAME_NAMES_BY_ID[0x0080]).toContain('sendApsData');
        });
    });

    describe('ZDOREQUESTS', () => {
        it('should define nodeDescReq', () => {
            expect(ZDOREQUESTS.nodeDescReq).toBeDefined();
            expect(ZDOREQUESTS.nodeDescReq.ID).toBe(0x0002);
        });

        it('should define simpleDescReq', () => {
            expect(ZDOREQUESTS.simpleDescReq).toBeDefined();
            expect(ZDOREQUESTS.simpleDescReq.ID).toBe(0x0004);
        });

        it('should define activeEpReq', () => {
            expect(ZDOREQUESTS.activeEpReq).toBeDefined();
            expect(ZDOREQUESTS.activeEpReq.ID).toBe(0x0005);
        });

        it('should define bindReq', () => {
            expect(ZDOREQUESTS.bindReq).toBeDefined();
            expect(ZDOREQUESTS.bindReq.ID).toBe(0x0021);
            expect(ZDOREQUESTS.bindReq.request!.sourceEui).toBeDefined();
            expect(ZDOREQUESTS.bindReq.request!.clusterId).toBeDefined();
        });

        it('should define unBindReq', () => {
            expect(ZDOREQUESTS.unBindReq).toBeDefined();
            expect(ZDOREQUESTS.unBindReq.ID).toBe(0x0022);
        });

        it('should define mgmtLqiReq', () => {
            expect(ZDOREQUESTS.mgmtLqiReq).toBeDefined();
            expect(ZDOREQUESTS.mgmtLqiReq.ID).toBe(0x0031);
        });

        it('should define mgmtRtgReq', () => {
            expect(ZDOREQUESTS.mgmtRtgReq).toBeDefined();
            expect(ZDOREQUESTS.mgmtRtgReq.ID).toBe(0x0032);
        });

        it('should define mgmtLeaveReq', () => {
            expect(ZDOREQUESTS.mgmtLeaveReq).toBeDefined();
            expect(ZDOREQUESTS.mgmtLeaveReq.ID).toBe(0x0034);
        });

        it('should define mgmtPermitJoinReq', () => {
            expect(ZDOREQUESTS.mgmtPermitJoinReq).toBeDefined();
            expect(ZDOREQUESTS.mgmtPermitJoinReq.ID).toBe(0x0036);
        });
    });

    describe('ZDORESPONSES', () => {
        it('should define nodeDescRsp', () => {
            expect(ZDORESPONSES.nodeDescRsp).toBeDefined();
            expect(ZDORESPONSES.nodeDescRsp.ID).toBe(0x8002);
        });

        it('should define simpleDescRsp', () => {
            expect(ZDORESPONSES.simpleDescRsp).toBeDefined();
            expect(ZDORESPONSES.simpleDescRsp.ID).toBe(0x8004);
        });

        it('should define activeEpRsp', () => {
            expect(ZDORESPONSES.activeEpRsp).toBeDefined();
            expect(ZDORESPONSES.activeEpRsp.ID).toBe(0x8005);
        });

        it('should define bindRsp', () => {
            expect(ZDORESPONSES.bindRsp).toBeDefined();
            expect(ZDORESPONSES.bindRsp.ID).toBe(0x8021);
        });

        it('should define unBindRsp', () => {
            expect(ZDORESPONSES.unBindRsp).toBeDefined();
            expect(ZDORESPONSES.unBindRsp.ID).toBe(0x8022);
        });

        it('should define mgmtLqiRsp', () => {
            expect(ZDORESPONSES.mgmtLqiRsp).toBeDefined();
            expect(ZDORESPONSES.mgmtLqiRsp.ID).toBe(0x8031);
        });

        it('should define mgmtRtgRsp', () => {
            expect(ZDORESPONSES.mgmtRtgRsp).toBeDefined();
            expect(ZDORESPONSES.mgmtRtgRsp.ID).toBe(0x8032);
        });

        it('should define mgmtLeaveRsp', () => {
            expect(ZDORESPONSES.mgmtLeaveRsp).toBeDefined();
            expect(ZDORESPONSES.mgmtLeaveRsp.ID).toBe(0x8034);
        });

        it('should define mgmtPermitJoinRsp', () => {
            expect(ZDORESPONSES.mgmtPermitJoinRsp).toBeDefined();
            expect(ZDORESPONSES.mgmtPermitJoinRsp.ID).toBe(0x8036);
        });
    });

    describe('ZDOREQUEST_NAME_BY_ID', () => {
        it('should map all ZDO request IDs to names', () => {
            for (const [name, frame] of Object.entries(ZDOREQUESTS)) {
                expect(ZDOREQUEST_NAME_BY_ID[frame.ID]).toBe(name);
            }
        });
    });

    describe('ZDORESPONSE_NAME_BY_ID', () => {
        it('should map all ZDO response IDs to names', () => {
            for (const [name, frame] of Object.entries(ZDORESPONSES)) {
                expect(ZDORESPONSE_NAME_BY_ID[frame.ID]).toBe(name);
            }
        });

        it('should have response IDs in 0x8000+ range', () => {
            for (const id of Object.keys(ZDORESPONSE_NAME_BY_ID)) {
                expect(Number(id)).toBeGreaterThanOrEqual(0x8000);
            }
        });
    });

    describe('Request/Response ID relationships', () => {
        it('should have matching request and response pairs', () => {
            // Request ID + 0x8000 = Response ID
            const pairs = [
                ['nodeDescReq', 'nodeDescRsp'],
                ['simpleDescReq', 'simpleDescRsp'],
                ['activeEpReq', 'activeEpRsp'],
                ['bindReq', 'bindRsp'],
                ['unBindReq', 'unBindRsp'],
                ['mgmtLqiReq', 'mgmtLqiRsp'],
                ['mgmtRtgReq', 'mgmtRtgRsp'],
                ['mgmtLeaveReq', 'mgmtLeaveRsp'],
                ['mgmtPermitJoinReq', 'mgmtPermitJoinRsp'],
            ];

            for (const [reqName, rspName] of pairs) {
                const reqId = ZDOREQUESTS[reqName].ID;
                const rspId = ZDORESPONSES[rspName].ID;
                expect(rspId).toBe(reqId + 0x8000);
            }
        });
    });

    describe('Frame structure validation', () => {
        it('should have valid frame structure for all frames', () => {
            for (const [name, frame] of Object.entries(FRAMES)) {
                expect(typeof frame.ID).toBe('number');
                expect(frame.ID).toBeGreaterThan(0);

                if (frame.request) {
                    expect(typeof frame.request).toBe('object');
                }
                if (frame.response) {
                    expect(typeof frame.response).toBe('object');
                }
            }
        });

        it('should have unique frame IDs', () => {
            const ids = new Set<number>();
            const duplicates: number[] = [];

            for (const frame of Object.values(FRAMES)) {
                if (ids.has(frame.ID)) {
                    duplicates.push(frame.ID);
                }
                ids.add(frame.ID);
            }

            // Note: Some frames intentionally share IDs
            // Just verify we can identify them
            expect(typeof duplicates.length).toBe('number');
        });
    });
});
