#include <stdint.h>

#define RULE_VETO        1u
#define RULE_DEPTH       2u
#define RULE_CAPABILITY  4u
#define RULE_ROUNDTRIP   8u
#define RULE_ADDRESS    16u
#define RULE_IDEMPOTENT 32u
#define RULE_ALL        63u

enum {
    OP_CONST=0, OP_ASK=1, OP_ATTR=2, OP_RET=3, OP_ANSWER=4, OP_DROP=5,
    OP_BIN=6, OP_CMP=7, OP_IF=8, OP_CALL=9, OP_BLOCK=10, OP_ELSE=11,
    OP_END=12, OP_FUNC=13, OP_HALT=14
};

enum { TAG_NONE=0, TAG_NUM=1, TAG_FUNC=2 };

typedef struct {
    int32_t op;
    int32_t a;
    int32_t b;
    int32_t pad;
    double imm;
} I13Inst;

typedef struct {
    int32_t start;
    int32_t count;
    int32_t param_count;
    int32_t local_count;
} I13Func;

static int32_t g_val_peak=0, g_val_error_pc=-1, g_val_error_code=0;
static int32_t g_val_final_height=0, g_val_error_region=-1, g_val_regions=0;

static int32_t g_vm_steps=0, g_vm_peak=0, g_vm_error_pc=-1, g_vm_error_code=0;
static int32_t g_vm_final_height=0, g_vm_max_call_depth=0, g_vm_calls=0;
static int32_t g_vm_last_func=-1;

#define TRACE_MAX 1024
static int32_t g_trace_event[TRACE_MAX];
static int32_t g_trace_depth[TRACE_MAX];
static int32_t g_trace_func[TRACE_MAX];
static int32_t g_trace_pc[TRACE_MAX];
static int32_t g_trace_count=0;

// ---- I13.GFX native command plane -----------------------------------------
enum {
    GFX_CLEAR=1, GFX_CAMERA=2, GFX_CUBE=3, GFX_SPHERE=4, GFX_COLOR=5, GFX_ROTATE=6
};
enum {
    BI_GFX_CLEAR=-1, BI_GFX_CAMERA=-2, BI_GFX_CUBE=-3, BI_GFX_SPHERE=-4,
    BI_GFX_COLOR=-5, BI_GFX_ROTATE=-6, BI_GFX_TIME=-7
};
typedef struct {
    int32_t op;
    int32_t id;
    float a,b,c,d,e,f;
} I13GfxCmd;
#define GFX_MAX 2048
static I13GfxCmd g_gfx[GFX_MAX];
static int32_t g_gfx_count=0;
static double g_host_time=0.0;

static int gfx_emit(int32_t op,int32_t id,float a,float b,float c,float d,float e,float f){
    if(g_gfx_count>=GFX_MAX)return 0;
    I13GfxCmd *q=&g_gfx[g_gfx_count++];
    q->op=op;q->id=id;q->a=a;q->b=b;q->c=c;q->d=d;q->e=e;q->f=f;
    return 1;
}
__attribute__((export_name("i13_set_host_time"))) void i13_set_host_time(double t){g_host_time=t;}
__attribute__((export_name("i13_gfx_reset"))) void i13_gfx_reset(void){g_gfx_count=0;}
__attribute__((export_name("i13_gfx_count"))) int32_t i13_gfx_count(void){return g_gfx_count;}
__attribute__((export_name("i13_gfx_ptr"))) uint32_t i13_gfx_ptr(void){return (uint32_t)(uintptr_t)g_gfx;}
__attribute__((export_name("i13_gfx_stride"))) int32_t i13_gfx_stride(void){return (int32_t)sizeof(I13GfxCmd);}

enum {
    VERR_NONE=0, VERR_UNDERFLOW=1, VERR_ELSE_WITHOUT_IF=2, VERR_END_WITHOUT_OPEN=3,
    VERR_BLOCK_HEIGHT=4, VERR_IF_HEIGHT=5, VERR_UNCLOSED_CONTROL=6,
    VERR_FINAL_HEIGHT=7, VERR_CONTROL_OVERFLOW=8, VERR_BAD_OPCODE=9
};

enum {
    VM_OK=1, VM_ERR_VALIDATE=-1, VM_ERR_STACK_UNDERFLOW=-2, VM_ERR_STACK_OVERFLOW=-3,
    VM_ERR_UNBOUND=-4, VM_ERR_ASSIGN_UNDECLARED=-5, VM_ERR_DIV_ZERO=-6,
    VM_ERR_BAD_BIN=-7, VM_ERR_BAD_CMP=-8, VM_ERR_BAD_JUMP=-9,
    VM_ERR_UNSUPPORTED=-10, VM_ERR_STEP_LIMIT=-11, VM_ERR_BAD_SLOT=-12,
    VM_ERR_TYPE=-13, VM_ERR_BAD_FUNC=-14, VM_ERR_ARITY=-15,
    VM_ERR_CALL_DEPTH=-16, VM_ERR_LOCAL_OVERFLOW=-17, VM_ERR_RET_MAIN=-18
};

enum { TRACE_ENTER=1, TRACE_CALL=2, TRACE_RET=3, TRACE_HALT=4 };

__attribute__((export_name("i13_hash32")))
uint32_t i13_hash32(uint32_t ptr, uint32_t len) {
    const uint8_t *p=(const uint8_t *)(uintptr_t)ptr; uint32_t h=2166136261u;
    for(uint32_t i=0;i<len;++i){h^=p[i];h*=16777619u;} return h;
}

__attribute__((export_name("i13_effect_need")))
uint32_t i13_effect_need(uint32_t opcode,uint32_t argc){
    switch(opcode){
        case OP_CONST:case OP_ASK:return 0;
        case OP_ATTR:case OP_RET:case OP_ANSWER:case OP_DROP:case OP_IF:return 1;
        case OP_BIN:case OP_CMP:return 2;
        case OP_CALL:return argc+1;
        default:return 0;
    }
}
__attribute__((export_name("i13_effect_net")))
int32_t i13_effect_net(uint32_t opcode,uint32_t argc){
    switch(opcode){
        case OP_CONST:case OP_ASK:return 1;
        case OP_ATTR:case OP_RET:return 0;
        case OP_ANSWER:case OP_DROP:case OP_BIN:case OP_CMP:case OP_IF:return -1;
        case OP_CALL:return -(int32_t)argc;
        default:return 0;
    }
}

__attribute__((export_name("cortex_depth_ok")))
uint32_t cortex_depth_ok(uint32_t depth,uint32_t limit){return depth<=limit?1u:0u;}
__attribute__((export_name("cortex_capability_ok")))
uint32_t cortex_capability_ok(uint32_t requested,uint32_t granted){return (requested&~granted)==0u?1u:0u;}
__attribute__((export_name("cortex_idempotence_ok")))
uint32_t cortex_idempotence_ok(uint32_t existing,uint32_t candidate){return existing==0u||existing==candidate?1u:0u;}
__attribute__((export_name("cortex_address32")))
uint32_t cortex_address32(uint32_t semantic,uint32_t capability,uint32_t version){
    uint32_t h=2166136261u;h=(h^semantic)*16777619u;h=(h^capability)*16777619u;h=(h^version)*16777619u;return h;
}
__attribute__((export_name("cortex_verdict")))
uint32_t cortex_verdict(uint32_t inbound,uint32_t depth,uint32_t cap,uint32_t roundtrip,uint32_t address,uint32_t idem){
    uint32_t m=0;if(inbound)m|=RULE_VETO;if(depth)m|=RULE_DEPTH;if(cap)m|=RULE_CAPABILITY;
    if(roundtrip)m|=RULE_ROUNDTRIP;if(address)m|=RULE_ADDRESS;if(idem)m|=RULE_IDEMPOTENT;return m;
}
__attribute__((export_name("cortex_all_rules_pass")))
uint32_t cortex_all_rules_pass(uint32_t mask){return (mask&RULE_ALL)==RULE_ALL?1u:0u;}
__attribute__((export_name("cortex_rule_all_mask")))
uint32_t cortex_rule_all_mask(void){return RULE_ALL;}

static int32_t validate_region(const I13Inst *code,uint32_t start,uint32_t count,int32_t region){
    int32_t kind[256],entryH[256],entryLive[256],thenLive[256],thenH[256];
    int32_t csp=0,h=0,peak=0,live=1;
    #define VFAIL(code_,pc_) do{if(g_val_error_code==VERR_NONE){g_val_error_code=(code_);g_val_error_pc=(pc_);g_val_error_region=(region);}}while(0)
    for(uint32_t off=0;off<count;++off){
        uint32_t pc=start+off;int32_t op=code[pc].op;
        if(op==OP_BLOCK){
            if(csp>=256){VFAIL(VERR_CONTROL_OVERFLOW,(int32_t)pc);live=0;break;}
            kind[csp]=1;entryH[csp]=h;entryLive[csp]=live;thenLive[csp]=-1;thenH[csp]=0;csp++;
        }else if(op==OP_IF){
            if(live){if(h<1){VFAIL(VERR_UNDERFLOW,(int32_t)pc);live=0;}else h--;}
            if(csp>=256){VFAIL(VERR_CONTROL_OVERFLOW,(int32_t)pc);live=0;break;}
            kind[csp]=2;entryH[csp]=h;entryLive[csp]=live;thenLive[csp]=-1;thenH[csp]=0;csp++;
        }else if(op==OP_ELSE){
            if(csp<=0||kind[csp-1]!=2){VFAIL(VERR_ELSE_WITHOUT_IF,(int32_t)pc);live=0;}
            else{int32_t i=csp-1;thenLive[i]=live;thenH[i]=live?h:0;live=entryLive[i];h=entryH[i];}
        }else if(op==OP_END){
            if(csp<=0){VFAIL(VERR_END_WITHOUT_OPEN,(int32_t)pc);live=0;}
            else{
                csp--;
                if(kind[csp]==1){
                    if(entryLive[csp]&&live&&h!=entryH[csp]){VFAIL(VERR_BLOCK_HEIGHT,(int32_t)pc);live=0;}
                }else{
                    int32_t tl=thenLive[csp]<0?entryLive[csp]:thenLive[csp];
                    int32_t th=thenLive[csp]<0?entryH[csp]:thenH[csp];
                    int32_t el=live,eh=live?h:0;
                    if(tl&&el&&th!=eh){VFAIL(VERR_IF_HEIGHT,(int32_t)pc);live=0;}
                    else if(tl){live=1;h=th;}else if(el){live=1;h=eh;}else{live=0;h=entryH[csp];}
                }
            }
        }else if(op==OP_RET){
            if(live){if(h<1){VFAIL(VERR_UNDERFLOW,(int32_t)pc);live=0;}else{h--;live=0;}}
        }else{
            uint32_t need=i13_effect_need((uint32_t)op,(uint32_t)code[pc].a);
            int32_t net=i13_effect_net((uint32_t)op,(uint32_t)code[pc].a);
            if(op<0||op>OP_HALT){VFAIL(VERR_BAD_OPCODE,(int32_t)pc);live=0;}
            else if(live){
                if((uint32_t)h<need){VFAIL(VERR_UNDERFLOW,(int32_t)pc);live=0;}
                else h+=net;
            }
        }
        if(live&&h>peak)peak=h;
    }
    if(csp>0)VFAIL(VERR_UNCLOSED_CONTROL,(int32_t)(start+count));
    if(live&&h!=0)VFAIL(VERR_FINAL_HEIGHT,(int32_t)(start+(count?count-1:0)));
    if(peak>g_val_peak)g_val_peak=peak;g_val_final_height=h;
    return g_val_error_code==VERR_NONE?1:0;
}

__attribute__((export_name("i13_validate_program")))
int32_t i13_validate_program(uint32_t inst_ptr,uint32_t main_start,uint32_t main_count,uint32_t funcs_ptr,uint32_t func_count){
    const I13Inst *code=(const I13Inst *)(uintptr_t)inst_ptr;const I13Func *funcs=(const I13Func *)(uintptr_t)funcs_ptr;
    g_val_peak=0;g_val_error_pc=-1;g_val_error_code=VERR_NONE;g_val_final_height=0;g_val_error_region=-1;g_val_regions=1+(int32_t)func_count;
    if(!validate_region(code,main_start,main_count,0))return 0;
    for(uint32_t i=0;i<func_count;++i)if(!validate_region(code,(uint32_t)funcs[i].start,(uint32_t)funcs[i].count,(int32_t)i+1))return 0;
    return 1;
}
__attribute__((export_name("i13_val_peak")))int32_t i13_val_peak(void){return g_val_peak;}
__attribute__((export_name("i13_val_error_pc")))int32_t i13_val_error_pc(void){return g_val_error_pc;}
__attribute__((export_name("i13_val_error_code")))int32_t i13_val_error_code(void){return g_val_error_code;}
__attribute__((export_name("i13_val_error_region")))int32_t i13_val_error_region(void){return g_val_error_region;}
__attribute__((export_name("i13_val_regions")))int32_t i13_val_regions(void){return g_val_regions;}

static double do_bin(int32_t k,double a,double b,int32_t *err){
    switch(k){case 0:return a+b;case 1:return a-b;case 2:return a*b;case 3:if(b==0.0){*err=VM_ERR_DIV_ZERO;return 0;}return a/b;default:*err=VM_ERR_BAD_BIN;return 0;}
}
static double do_cmp(int32_t k,double a,double b,int32_t *err){
    switch(k){case 0:return a<b?1:0;case 1:return a>b?1:0;case 2:return a<=b?1:0;case 3:return a>=b?1:0;case 4:return a==b?1:0;case 5:return a!=b?1:0;default:*err=VM_ERR_BAD_CMP;return 0;}
}

#define MAX_FRAMES 64
#define MAX_LOCALS 256
#define MAX_STACK 512
static double f_local_val[MAX_FRAMES][MAX_LOCALS];
static uint8_t f_local_tag[MAX_FRAMES][MAX_LOCALS];
static uint8_t f_local_state[MAX_FRAMES][MAX_LOCALS];
static double f_stack_val[MAX_FRAMES][MAX_STACK];
static uint8_t f_stack_tag[MAX_FRAMES][MAX_STACK];
static int32_t f_sp[MAX_FRAMES],f_pc[MAX_FRAMES],f_end[MAX_FRAMES],f_func[MAX_FRAMES];

static void trace_add(int32_t ev,int32_t depth,int32_t func,int32_t pc){
    if(g_trace_count<TRACE_MAX){g_trace_event[g_trace_count]=ev;g_trace_depth[g_trace_count]=depth;g_trace_func[g_trace_count]=func;g_trace_pc[g_trace_count]=pc;g_trace_count++;}
}
static int pushv(int d,double v,uint8_t tag){
    if(f_sp[d]>=MAX_STACK)return 0;f_stack_val[d][f_sp[d]]=v;f_stack_tag[d][f_sp[d]]=tag;f_sp[d]++;if(f_sp[d]>g_vm_peak)g_vm_peak=f_sp[d];return 1;
}
static int popv(int d,double *v,uint8_t *tag){
    if(f_sp[d]<1)return 0;f_sp[d]--;*v=f_stack_val[d][f_sp[d]];*tag=f_stack_tag[d][f_sp[d]];return 1;
}
static int getvar(int depth,int scope,int slot,double *v,uint8_t *tag,uint8_t *state,double *gv,uint8_t *gt,uint8_t *gs,uint32_t gc){
    if(scope==1){
        if(slot<0||(uint32_t)slot>=gc)return 0;*v=gv[slot];*tag=gt[slot];*state=gs[slot];return 1;
    }
    if(slot<0||slot>=MAX_LOCALS)return 0;*v=f_local_val[depth][slot];*tag=f_local_tag[depth][slot];*state=f_local_state[depth][slot];return 1;
}
static int setvar(int depth,int scope,int slot,int assign,double v,uint8_t tag,double *gv,uint8_t *gt,uint8_t *gs,uint32_t gc){
    if(scope==1){
        if(slot<0||(uint32_t)slot>=gc)return VM_ERR_BAD_SLOT;
        if(assign&&!gs[slot])return VM_ERR_ASSIGN_UNDECLARED;
        gv[slot]=v;gt[slot]=tag;gs[slot]=1;return 0;
    }
    if(slot<0||slot>=MAX_LOCALS)return VM_ERR_BAD_SLOT;
    if(assign&&!f_local_state[depth][slot])return VM_ERR_ASSIGN_UNDECLARED;
    f_local_val[depth][slot]=v;f_local_tag[depth][slot]=tag;f_local_state[depth][slot]=1;return 0;
}

__attribute__((export_name("i13_vm_exec_program")))
int32_t i13_vm_exec_program(
    uint32_t inst_ptr,uint32_t main_start,uint32_t main_count,
    uint32_t funcs_ptr,uint32_t func_count,
    uint32_t globals_val_ptr,uint32_t globals_tag_ptr,uint32_t globals_state_ptr,uint32_t global_count,
    uint32_t step_limit,uint32_t call_limit
){
    const I13Inst *code=(const I13Inst *)(uintptr_t)inst_ptr;const I13Func *funcs=(const I13Func *)(uintptr_t)funcs_ptr;
    double *gv=(double *)(uintptr_t)globals_val_ptr;uint8_t *gt=(uint8_t *)(uintptr_t)globals_tag_ptr;uint8_t *gs=(uint8_t *)(uintptr_t)globals_state_ptr;
    g_vm_steps=0;g_vm_peak=0;g_vm_error_pc=-1;g_vm_error_code=0;g_vm_final_height=0;g_vm_max_call_depth=0;g_vm_calls=0;g_vm_last_func=-1;g_trace_count=0;g_gfx_count=0;
    if(call_limit>MAX_FRAMES-1)call_limit=MAX_FRAMES-1;
    if(!i13_validate_program(inst_ptr,main_start,main_count,funcs_ptr,func_count)){g_vm_error_code=VM_ERR_VALIDATE;g_vm_error_pc=i13_val_error_pc();return VM_ERR_VALIDATE;}
    for(int d=0;d<MAX_FRAMES;++d){f_sp[d]=0;f_pc[d]=0;f_end[d]=0;f_func[d]=-1;}
    f_pc[0]=(int32_t)main_start;f_end[0]=(int32_t)(main_start+main_count);f_func[0]=-1;int depth=0;
    trace_add(TRACE_ENTER,0,-1,f_pc[0]);

    while(depth>=0){
        if(++g_vm_steps>(int32_t)step_limit){g_vm_error_code=VM_ERR_STEP_LIMIT;g_vm_error_pc=f_pc[depth];break;}
        if(f_pc[depth]>=f_end[depth]){
            if(depth==0){trace_add(TRACE_HALT,0,-1,f_pc[depth]);break;}
            g_vm_error_code=VM_ERR_UNSUPPORTED;g_vm_error_pc=f_pc[depth];break;
        }
        int32_t pc=f_pc[depth];I13Inst in=code[pc];double v=0,a=0,b=0;uint8_t tag=0,ta=0,tb=0,state=0;int err=0;
        if(in.op==OP_CONST){if(!pushv(depth,in.imm,TAG_NUM)){err=VM_ERR_STACK_OVERFLOW;}else f_pc[depth]++;}
        else if(in.op==OP_ASK){
            if(!getvar(depth,in.b,in.a,&v,&tag,&state,gv,gt,gs,global_count))err=VM_ERR_BAD_SLOT;
            else if(!state)err=VM_ERR_UNBOUND;
            else if(!pushv(depth,v,tag))err=VM_ERR_STACK_OVERFLOW;else f_pc[depth]++;
        }else if(in.op==OP_ATTR){
            if(f_sp[depth]<1)err=VM_ERR_STACK_UNDERFLOW;else f_pc[depth]++;
        }else if(in.op==OP_FUNC){
            if(in.b>=0 && (uint32_t)in.b>=func_count)err=VM_ERR_BAD_FUNC;
            else err=setvar(depth,1,in.a,0,(double)in.b,TAG_FUNC,gv,gt,gs,global_count);
            if(!err)f_pc[depth]++;
        }else if(in.op==OP_ANSWER){
            if(!popv(depth,&v,&tag))err=VM_ERR_STACK_UNDERFLOW;
            else{int mode=in.b&1,scope=(in.b>>1)&1;err=setvar(depth,scope,in.a,mode,v,tag,gv,gt,gs,global_count);if(!err)f_pc[depth]++;}
        }else if(in.op==OP_DROP){
            if(!popv(depth,&v,&tag))err=VM_ERR_STACK_UNDERFLOW;else f_pc[depth]++;
        }else if(in.op==OP_BIN){
            if(!popv(depth,&b,&tb)||!popv(depth,&a,&ta))err=VM_ERR_STACK_UNDERFLOW;
            else if(ta!=TAG_NUM||tb!=TAG_NUM)err=VM_ERR_TYPE;
            else{v=do_bin(in.a,a,b,&err);if(!err&&!pushv(depth,v,TAG_NUM))err=VM_ERR_STACK_OVERFLOW;if(!err)f_pc[depth]++;}
        }else if(in.op==OP_CMP){
            if(!popv(depth,&b,&tb)||!popv(depth,&a,&ta))err=VM_ERR_STACK_UNDERFLOW;
            else if(ta!=TAG_NUM||tb!=TAG_NUM)err=VM_ERR_TYPE;
            else{v=do_cmp(in.a,a,b,&err);if(!err&&!pushv(depth,v,TAG_NUM))err=VM_ERR_STACK_OVERFLOW;if(!err)f_pc[depth]++;}
        }else if(in.op==OP_IF){
            if(!popv(depth,&v,&tag))err=VM_ERR_STACK_UNDERFLOW;
            else if(tag!=TAG_NUM)err=VM_ERR_TYPE;
            else{if(v==0){if(in.a<0||(uint32_t)in.a>=main_start+main_count+1000000u)err=VM_ERR_BAD_JUMP;else f_pc[depth]=in.a;}else f_pc[depth]++;}
        }else if(in.op==OP_ELSE){
            if(in.a<0)err=VM_ERR_BAD_JUMP;else f_pc[depth]=in.a;
        }else if(in.op==OP_BLOCK||in.op==OP_END){f_pc[depth]++;}
        else if(in.op==OP_CALL){
            uint32_t argc=(uint32_t)in.a;if(f_sp[depth]<(int32_t)(argc+1))err=VM_ERR_STACK_UNDERFLOW;
            else{
                double args[MAX_LOCALS];uint8_t argtags[MAX_LOCALS];
                if(argc>MAX_LOCALS)err=VM_ERR_LOCAL_OVERFLOW;
                else{
                    for(int i=(int)argc-1;i>=0;--i)popv(depth,&args[i],&argtags[i]);
                    popv(depth,&v,&tag);
                    if(tag!=TAG_FUNC)err=VM_ERR_TYPE;
                    else{
                        int fid=(int)v;
                        if(fid<0){
                            for(uint32_t i=0;i<argc;++i) if(argtags[i]!=TAG_NUM){err=VM_ERR_TYPE;break;}
                            if(!err){
                                double out=0.0;
                                if(fid==BI_GFX_TIME){
                                    if(argc!=0)err=VM_ERR_ARITY; else out=g_host_time;
                                }else if(fid==BI_GFX_CLEAR){
                                    if(argc!=3)err=VM_ERR_ARITY;
                                    else if(!gfx_emit(GFX_CLEAR,0,(float)args[0],(float)args[1],(float)args[2],0,0,0))err=VM_ERR_STACK_OVERFLOW;
                                }else if(fid==BI_GFX_CAMERA){
                                    if(argc!=6)err=VM_ERR_ARITY;
                                    else if(!gfx_emit(GFX_CAMERA,0,(float)args[0],(float)args[1],(float)args[2],(float)args[3],(float)args[4],(float)args[5]))err=VM_ERR_STACK_OVERFLOW;
                                }else if(fid==BI_GFX_CUBE){
                                    if(argc!=5)err=VM_ERR_ARITY;
                                    else if(!gfx_emit(GFX_CUBE,(int32_t)args[0],(float)args[1],(float)args[2],(float)args[3],(float)args[4],0,0))err=VM_ERR_STACK_OVERFLOW;
                                }else if(fid==BI_GFX_SPHERE){
                                    if(argc!=5)err=VM_ERR_ARITY;
                                    else if(!gfx_emit(GFX_SPHERE,(int32_t)args[0],(float)args[1],(float)args[2],(float)args[3],(float)args[4],0,0))err=VM_ERR_STACK_OVERFLOW;
                                }else if(fid==BI_GFX_COLOR){
                                    if(argc!=4)err=VM_ERR_ARITY;
                                    else if(!gfx_emit(GFX_COLOR,(int32_t)args[0],(float)args[1],(float)args[2],(float)args[3],0,0,0))err=VM_ERR_STACK_OVERFLOW;
                                }else if(fid==BI_GFX_ROTATE){
                                    if(argc!=4)err=VM_ERR_ARITY;
                                    else if(!gfx_emit(GFX_ROTATE,(int32_t)args[0],(float)args[1],(float)args[2],(float)args[3],0,0,0))err=VM_ERR_STACK_OVERFLOW;
                                }else err=VM_ERR_BAD_FUNC;
                                if(!err){
                                    if(!pushv(depth,out,TAG_NUM))err=VM_ERR_STACK_OVERFLOW;
                                    else {g_vm_calls++;f_pc[depth]++;}
                                }
                            }
                        }else if((uint32_t)fid>=func_count)err=VM_ERR_BAD_FUNC;
                        else if(funcs[fid].param_count!=(int32_t)argc)err=VM_ERR_ARITY;
                        else if(depth+1>(int)call_limit)err=VM_ERR_CALL_DEPTH;
                        else if(funcs[fid].local_count>MAX_LOCALS)err=VM_ERR_LOCAL_OVERFLOW;
                        else{
                            f_pc[depth]++;trace_add(TRACE_CALL,depth,fid,pc);
                            depth++;if(depth>g_vm_max_call_depth)g_vm_max_call_depth=depth;g_vm_calls++;g_vm_last_func=fid;
                            f_sp[depth]=0;f_pc[depth]=funcs[fid].start;f_end[depth]=funcs[fid].start+funcs[fid].count;f_func[depth]=fid;
                            for(int i=0;i<MAX_LOCALS;++i){f_local_state[depth][i]=0;f_local_tag[depth][i]=TAG_NONE;f_local_val[depth][i]=0;}
                            for(uint32_t i=0;i<argc;++i){f_local_state[depth][i]=1;f_local_tag[depth][i]=argtags[i];f_local_val[depth][i]=args[i];}
                            trace_add(TRACE_ENTER,depth,fid,f_pc[depth]);
                        }
                    }
                }
            }
        }else if(in.op==OP_RET){
            if(depth==0)err=VM_ERR_RET_MAIN;
            else if(!popv(depth,&v,&tag))err=VM_ERR_STACK_UNDERFLOW;
            else{
                int fid=f_func[depth];trace_add(TRACE_RET,depth,fid,pc);depth--;
                if(!pushv(depth,v,tag))err=VM_ERR_STACK_OVERFLOW;
            }
        }else if(in.op==OP_HALT){
            if(depth==0){trace_add(TRACE_HALT,0,-1,pc);break;}
            else err=VM_ERR_UNSUPPORTED;
        }else err=VM_ERR_UNSUPPORTED;

        if(err){g_vm_error_code=err;g_vm_error_pc=pc;break;}
    }
    g_vm_final_height=depth>=0?f_sp[depth]:0;
    return g_vm_error_code?g_vm_error_code:VM_OK;
}

__attribute__((export_name("i13_vm_steps")))int32_t i13_vm_steps(void){return g_vm_steps;}
__attribute__((export_name("i13_vm_peak")))int32_t i13_vm_peak(void){return g_vm_peak;}
__attribute__((export_name("i13_vm_error_pc")))int32_t i13_vm_error_pc(void){return g_vm_error_pc;}
__attribute__((export_name("i13_vm_error_code")))int32_t i13_vm_error_code(void){return g_vm_error_code;}
__attribute__((export_name("i13_vm_final_height")))int32_t i13_vm_final_height(void){return g_vm_final_height;}
__attribute__((export_name("i13_vm_max_call_depth")))int32_t i13_vm_max_call_depth(void){return g_vm_max_call_depth;}
__attribute__((export_name("i13_vm_calls")))int32_t i13_vm_calls(void){return g_vm_calls;}
__attribute__((export_name("i13_vm_last_func")))int32_t i13_vm_last_func(void){return g_vm_last_func;}
__attribute__((export_name("i13_trace_count")))int32_t i13_trace_count(void){return g_trace_count;}
__attribute__((export_name("i13_trace_event")))int32_t i13_trace_event(int32_t i){return i>=0&&i<g_trace_count?g_trace_event[i]:0;}
__attribute__((export_name("i13_trace_depth")))int32_t i13_trace_depth(int32_t i){return i>=0&&i<g_trace_count?g_trace_depth[i]:-1;}
__attribute__((export_name("i13_trace_func")))int32_t i13_trace_func(int32_t i){return i>=0&&i<g_trace_count?g_trace_func[i]:-1;}
__attribute__((export_name("i13_trace_pc")))int32_t i13_trace_pc(int32_t i){return i>=0&&i<g_trace_count?g_trace_pc[i]:-1;}
