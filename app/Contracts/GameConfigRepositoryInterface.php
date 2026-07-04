<?php

namespace App\Contracts;

interface GameConfigRepositoryInterface
{
    public function getConfig(): array;
}
