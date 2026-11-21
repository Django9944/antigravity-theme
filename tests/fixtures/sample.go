package theme

import (
	"context"
	"fmt"
)

type Variant struct {
	ID    string  `json:"id"`
	Alpha float64 `json:"alpha"`
}

func EmitBanner(ctx context.Context, ch chan<- string, v Variant) error {
	if v.ID == "" {
		return fmt.Errorf("missing variant id")
	}
	select {
	case ch <- fmt.Sprintf("antigravity:%s@%.2f", v.ID, v.Alpha):
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}
